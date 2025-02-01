import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import ProductLayout from '../forms/ProductLayout';
import { supabase } from '../lib/supabase';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = React.useState(null);
  const [seller, setSeller] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [reactions, setReactions] = React.useState([]);
  const [isVendedor, setIsVendedor] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
  const [isEditing, setIsEditing] = React.useState(false);
  const [newMediaFiles, setNewMediaFiles] = React.useState([]);
  const [uploadingMedia, setUploadingMedia] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    price: '',
    size: '',
    condition: '',
    stock: 0
  });

  React.useEffect(() => {
    if (id) {
      fetchProductDetails();
      checkUserRole();
      fetchReactions();
    }
  }, [id]);

  React.useEffect(() => {
    if (product) {
      setEditForm({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        size: product.size,
        condition: product.condition,
        stock: product.stock
      });
    }
  }, [product]);

  const checkUserRole = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.uid)
          .single();

        if (error) throw error;

        setIsVendedor(profile?.role === 'vendedor');

        // Check if current user is the product owner
        if (product) {
          setIsOwner(product.seller_id === user.uid);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          media:product_media(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(product);

      // Check ownership after fetching product
      const user = auth.currentUser;
      if (user) {
        setIsOwner(product.seller_id === user.uid);
      }

      // Fetch seller details
      const { data: seller } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', product.seller_id)
        .single();

      setSeller(seller);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Erro ao carregar produto');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!product || !id) return;

      const updates = {
        title: editForm.title,
        description: editForm.description,
        price: parseFloat(editForm.price),
        size: editForm.size,
        condition: editForm.condition,
        stock: parseInt(editForm.stock.toString())
      };

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Produto atualizado com sucesso');
      setIsEditing(false);
      fetchProductDetails(); 
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reactions')
        .select('reaction_type')
        .eq('product_id', id);

      if (error) throw error;
      setReactions(data.map(r => r.reaction_type));
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      const { error } = await supabase
        .from('product_reactions')
        .insert({
          product_id: id,
          user_id: user.uid,
          reaction_type: reactionType,
        });

      if (error) throw error;

      fetchReactions();
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast.error('Erro ao adicionar reação');
    }
  };

  const handleMediaUpload = async () => {
    if (!newMediaFiles.length) return;

    setUploadingMedia(true);
    try {
      const mediaUrls = [];
      for (const file of newMediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        mediaUrls.push({
          media_url: publicUrl,
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
        });
      }

      const { error: mediaError } = await supabase
        .from('product_media')
        .insert(
          mediaUrls.map((media, index) => ({
            product_id: id,
            media_url: media.media_url,
            media_type: media.media_type,
            display_order: (product?.media?.length || 0) + index,
          }))
        );

      if (mediaError) throw mediaError;

      toast.success('Mídia adicionada com sucesso');
      setNewMediaFiles([]);
      fetchProductDetails();
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Erro ao adicionar mídia');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleNewMediaSelect = (e) => {
    if (e.target.files) {
      setNewMediaFiles(Array.from(e.target.files));
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      const { error } = await supabase
        .from('product_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;
      toast.success('Mídia removida com sucesso');
      fetchProductDetails();
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Erro ao remover mídia');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Produto não encontrado</p>
      </div>
    );
  }
  return (
    <ProductLayout 
      reactions={reactions}
      onReaction={handleReaction}
      product={product}
      seller={seller}
      isOwner={isOwner}
      isVendedor={isVendedor}
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onEditSave={handleSave}
      onEditCancel={() => setIsEditing(false)}
      onMediaUpload={handleMediaUpload}
      onNewMediaSelect={handleNewMediaSelect}
      onMediaDelete={handleDeleteMedia}
      newMediaFiles={newMediaFiles}
      uploadingMedia={uploadingMedia}
      currentMediaIndex={currentMediaIndex}
      onMediaIndexChange={setCurrentMediaIndex}
      onAddToCart={() => addToCart(product.id)}
    />
    
  );
}
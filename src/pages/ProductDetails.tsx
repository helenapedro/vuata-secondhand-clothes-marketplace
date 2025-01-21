import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Product, ProductMedia } from './../types/index';
import toast from 'react-hot-toast';
import { Mail, Heart, ThumbsUp, Star, ChevronLeft, ChevronRight, Pencil, Trash2, Upload } from 'lucide-react';
import { useCart } from '../hooks/useCart';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [seller, setSeller] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reactions, setReactions] = React.useState<string[]>([]);
  const [isVendedor, setIsVendedor] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = React.useState(0);
  const [isEditing, setIsEditing] = React.useState(false);
  const [newMediaFiles, setNewMediaFiles] = React.useState<File[]>([]);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setIsVendedor(profile?.role === 'vendedor');
        
        // Check if current user is the product owner
        if (product) {
          setIsOwner(product.seller_id === session.user.id);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsOwner(product.seller_id === session.user.id);
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

  const handleReaction = async (reactionType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('User not logged in');

      const { error } = await supabase
        .from('product_reactions')
        .insert({
          product_id: id,
          user_id: session.user.id,
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

  const handleNewMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewMediaFiles(Array.from(e.target.files));
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Media Gallery */}
          <div className="space-y-4">
            <div className="relative">
              {product.media && product.media.length > 0 ? (
                <>
                  {product.media[currentMediaIndex].media_type === 'video' ? (
                    <video
                      src={product.media[currentMediaIndex].media_url}
                      controls
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={product.media[currentMediaIndex].media_url}
                      alt={product.title}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  )}
                  {product.media.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between">
                      <button
                        onClick={() => setCurrentMediaIndex((prev) => (prev === 0 ? (product?.media?.length || 1) - 1 : prev - 1))}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentMediaIndex((prev) => (prev === (product?.media?.length || 1) - 1 ? 0 : prev + 1))}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => product.media && handleDeleteMedia(product.media[currentMediaIndex].id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">
                  <p className="text-gray-500">Sem imagens disponíveis</p>
                </div>
              )}
            </div>
            
            {/* Media Upload Section for Owners */}
            {isOwner && (
              <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleNewMediaSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">
                    Clique para adicionar mais fotos ou vídeos
                  </span>
                </label>
                {newMediaFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {newMediaFiles.length} arquivo(s) selecionado(s)
                    </p>
                    <button
                      onClick={handleMediaUpload}
                      disabled={uploadingMedia}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {uploadingMedia ? 'Enviando...' : 'Enviar Arquivos'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              {isOwner && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Título"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Descrição"
                  rows={4}
                />
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Preço"
                  min="0"
                  step="0.01"
                />
                <input
                  type="text"
                  value={editForm.size}
                  onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Tamanho"
                />
                <select
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option>Como Novo</option>
                  <option>Pouco Usado</option>
                  <option>Usado</option>
                  <option>Muito Usado</option>
                </select>
                <input
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                  placeholder="Quantidade em Estoque"
                  min="0"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-2xl text-indigo-600 font-bold mb-4">
                  {new Intl.NumberFormat('pt-AO', {
                    style: 'currency',
                    currency: 'AOA'
                  }).format(product.price)}
                </p>
                <div className="space-y-4 mb-6">
                  <p className="text-gray-600">
                    <span className="font-semibold">Tamanho:</span> {product.size}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Estado:</span> {product.condition}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Em Estoque:</span> {product.stock} unidades
                  </p>
                  {seller && (
                    <div className="text-gray-600">
                      <span className="font-semibold">Vendedor:</span>{' '}
                      {seller.full_name}
                      {seller.whatsapp && (
                        <a
                          href={`https://wa.me/${seller.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-green-600 hover:text-green-700"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {!isVendedor && !isOwner && (
                  <>
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={!product.stock}
                      className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 mb-4 disabled:opacity-50"
                    >
                      {product.stock ? 'Adicionar ao Carrinho' : 'Fora de Estoque'}
                    </button>
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={() => handleReaction('love')}
                        className="flex items-center space-x-1 text-pink-600 hover:text-pink-700"
                      >
                        <Heart className="w-5 h-5" />
                        <span>{reactions.filter(r => r === 'love').length}</span>
                      </button>
                      <button
                        onClick={() => handleReaction('like')}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        <span>{reactions.filter(r => r === 'like').length}</span>
                      </button>
                    </div>
                  </>
                )}

                <div className="bg-gray-50 p-4 rounded-md">
                  <h2 className="font-semibold mb-2">Descrição</h2>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
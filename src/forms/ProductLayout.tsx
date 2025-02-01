import React from 'react';
import { Product, User } from '../types';
import { Heart, ThumbsUp, ChevronLeft, ChevronRight, Pencil, Trash2, Upload } from 'lucide-react';

interface ProductLayoutProps {
  reactions: string[];
  product: Product;
  seller?: User;
  isOwner: boolean;
  isVendedor: boolean;
  currentMediaIndex: number;
  setCurrentMediaIndex: (index: number) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editForm: {
    title: string;
    description: string;
    price: string;
    size: string;
    condition: string;
    stock: number;
  };
  setEditForm: (form: { title: string; description: string; price: string; size: string; condition: string; stock: number; }) => void;
  newMediaFiles: File[];
  handleNewMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingMedia: boolean;
  handleMediaUpload: () => void;
  handleSave: () => void;
  handleDeleteMedia: (mediaId: string) => void;
  addToCart: (productId: string) => void;
  handleReaction: (reaction: string) => void;
}

const ProductLayout: React.FC<ProductLayoutProps> = ({
  reactions,
  product,
  seller,
  isOwner,
  isVendedor,
  currentMediaIndex,
  setCurrentMediaIndex,
  isEditing,
  setIsEditing,
  editForm,
  setEditForm,
  newMediaFiles,
  handleNewMediaSelect,
  uploadingMedia,
  handleMediaUpload,
  handleSave,
  handleDeleteMedia,
  addToCart,
  handleReaction,
}) => {
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
};

export default ProductLayout;

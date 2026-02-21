import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaHeart, FaRegHeart, FaComment, FaShareAlt, FaTrash } from "react-icons/fa";

// --- Estilos y Utilidades ---
import "../styles/community.css";
import { formatDate } from "../utils/dateUtils";

/**
 * Formatea una fecha a formato relativo simple (estilo Twitter).
 * Ejemplos: "Hace 2h", "Hace 3d", "Hace 1 sem"
 */
const formatRelativeDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  if (diffWeeks < 4) return `Hace ${diffWeeks} sem`;
  if (diffMonths < 12) return `Hace ${diffMonths} mes`;
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
};

// --- Contexto y Configuración ---
import { useToast } from "../context/ToastContext";
import API_BASE_URL from "../config/api";

// ==========================================
// 📋 CONSTANTES
// ==========================================
const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "General", label: "General" },
  { id: "Consejos CV", label: "Consejos CV" },
  { id: "Entrevistas", label: "Entrevistas" },
  { id: "Networking", label: "Networking" },
  { id: "Ofertas Laborales", label: "Ofertas Laborales" },
  { id: "Dudas Técnicas", label: "Dudas Técnicas" },
];

/** Categorías para el selector del formulario (sin "Todos") */
const FORM_CATEGORIES = CATEGORIES.filter(c => c.id !== "all");

// ==========================================
// 👥 PÁGINA: COMUNIDAD (Community)
// ==========================================
function Community({ user }) {
  // --- 1. Hooks ---
  const { addToast } = useToast();
  const isLogged = !!user;

  // --- 2. Estados: Datos del Feed ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 3. Estados: Formulario de Nuevo Post ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");  // coincide con id del catálogo
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 4. Estados: Filtro de Categoría ---
  const [selectedCategory, setSelectedCategory] = useState("all");

  // --- Derived: posts filtrados ---
  const filteredPosts = selectedCategory === "all"
    ? posts
    : posts.filter(p => p.category?.trim() === selectedCategory);

  // --- 4. Estados: Gestión de Comentarios ---
  const [openComments, setOpenComments] = useState({}); // { postId: boolean }
  const [commentText, setCommentText] = useState({}); // { postId: string }
  const [submittingComment, setSubmittingComment] = useState({}); // { postId: boolean }

  // --- 5. Efectos: Carga inicial ---
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/community/posts`);
        if (!res.ok) throw new Error("Error de conexión");
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
        addToast("No pudimos cargar los posts. Probá recargar.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [addToast]);

  // ==========================================
  // 📡 LÓGICA DE POSTS
  // ==========================================

  /**
   * Crea una nueva publicación en la comunidad.
   */
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      addToast("El título y el contenido son obligatorios", "info");
      return;
    }

    if (!isLogged) {
      addToast("Debés iniciar sesión para publicar", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        },
        body: JSON.stringify({
          authorName: user?.name || "Usuario anónimo",
          authorEmail: user?.email || "",
          title: title.trim(),
          content: content.trim(),
          category
        }),
      });

      if (!res.ok) throw new Error("Error al crear post");
      const newPost = await res.json();

      setPosts((prev) => [newPost, ...prev]);
      setTitle("");
      setContent("");
      setCategory("General");
      addToast("¡Post publicado con éxito! 🎉", "success");
    } catch (err) {
      addToast("Hubo un problema al publicar. Volvé a intentar.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gestiona los likes de forma optimista.
   */
  const handleLike = async (postId) => {
    if (!isLogged) {
      addToast("Debés iniciar sesión para dar like", "info");
      return;
    }

    const token = localStorage.getItem("joblu_token");
    if (!token) {
      addToast("Error de sesión. Por favor reconectate.", "error");
      return;
    }

    // Actualización optimista en la UI
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;
        const alreadyLiked = p.likedBy?.includes(user.id);
        let newLikedBy = p.likedBy ? [...p.likedBy] : [];
        if (alreadyLiked) newLikedBy = newLikedBy.filter((uid) => uid !== user.id);
        else newLikedBy.push(user.id);
        return { ...p, likedBy: newLikedBy };
      })
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      if (!res.ok) throw new Error("Error al dar like");
      // La actualización optimista ya se encargó de la UI.
      // Si quisieramos ser estrictos, podríamos confirmar con updatedData.likes
    } catch (error) {
      addToast("No pudimos registrar tu like", "error");
    }
  };

  /**
   * Copia el enlace del post al portapapeles.
   */
  const handleShare = (postId) => {
    const url = `${window.location.origin}/comunidad/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast("Enlace copiado al portapapeles 📋", "success");
    });
  };

  // ==========================================
  // 💬 LÓGICA DE COMENTARIOS
  // ==========================================

  const toggleComments = (postId) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!isLogged) {
      addToast("Debés iniciar sesión para comentar", "info");
      return;
    }

    const text = commentText[postId];
    if (!text?.trim()) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        },
        body: JSON.stringify({ content: text, authorName: user.name })
      });

      if (!res.ok) throw new Error("Error al comentar");
      const updatedPost = await res.json();

      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      addToast("Comentario agregado", "success");
    } catch (err) {
      addToast("Error al enviar comentario", "error");
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar comentario");
      }

      const updatedPost = await res.json();
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));
      addToast("Comentario eliminado", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // ==========================================
  // 📦 RENDERIZADO (JSX)
  // ==========================================
  return (
    <section className="community">
      {/* --- Hero Header --- */}
      <div className="community-hero">
        <h2>Comunidad JOBLU</h2>
        <p className="community-subtitle">El espacio para aprender, compartir y crecer junto a otros profesionales.</p>
      </div>

      {/* --- Sección: Crear Publicación --- */}
      <div className="community-create-card">
        <h3 className="community-create-title">Iniciá una conversación</h3>
        {!isLogged && (
          <div className="community-alert-info">💡 Para publicar necesitas <Link to="/login">iniciar sesión</Link>.</div>
        )}

        <form onSubmit={handleCreatePost} className="community-form">
          <label htmlFor="post-title" className="visually-hidden">Título del post</label>
          <input
            id="post-title"
            type="text"
            placeholder="¿Qué tenés en mente?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="community-input"
            disabled={isSubmitting || !isLogged}
          />

          <label htmlFor="post-category" className="visually-hidden">Categoría</label>
          <select
            id="post-category"
            className="community-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting || !isLogged}
          >
            {FORM_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
          </select>

          <label htmlFor="post-content" className="visually-hidden">Contenido del post</label>
          <textarea
            id="post-content"
            placeholder="¿Sobre qué categoría querés hablar? Contanos más..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="community-textarea community-input"
            disabled={isSubmitting || !isLogged}
          />

          <button
            type="submit"
            className={`btn-joblu ${isSubmitting || !isLogged ? "btn-disabled" : ""}`}
            disabled={isSubmitting || !isLogged}
          >
            {isSubmitting ? "Publicando..." : "Publicar post"}
          </button>
        </form>
      </div>

      {/* --- Chips de Categoría --- */}
      <div className="community-chips">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`community-chip${selectedCategory === cat.id ? " community-chip--active" : ""}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* --- Sección: Feed de la Comunidad --- */}
      <h3 className="community-list-title">Últimas conversaciones</h3>

      {loading ? (
        <div className="community-loading"><div className="spinner"></div> Cargando comunidad...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="community-empty">
          <p>
            {posts.length === 0
              ? "Todavía no hay nada por acá. ¡Sé el primero en romper el hielo! 🧊🔨"
              : "Todavía no hay conversaciones en esta categoría. ¡Sé el primero en preguntar!"}
          </p>
        </div>
      ) : (
        <div className="community-list">
          {filteredPosts.map((post) => (
            <article key={post._id} className="community-post">
              <div className="community-post-header">
                <span className="community-category-badge">{post.category || "General"}</span>
                <span className="community-post-meta">
                  <FaUser className="action-icon" />
                  {post.authorName || "Anónimo"}
                  <span className="community-post-meta-sep">·</span>
                  {formatRelativeDate(post.createdAt)}
                </span>
              </div>

              <div className="post-main">
                <Link to={`/comunidad/${post._id}`} className="community-post-title">{post.title}</Link>
                <p className="community-post-excerpt">{post.content}</p>
              </div>

              {/* Acciones del Post */}
              <div className="post-actions">
                <button className={`action-btn ${user && post.likedBy?.includes(user.id) ? "liked" : ""}`} onClick={() => handleLike(post._id)}>
                  <span className="action-icon">{user && post.likedBy?.includes(user.id) ? <FaHeart /> : <FaRegHeart />}</span>
                  <span className="action-count">{post.likedBy?.length || 0}</span>
                </button>
                <button className="action-btn" onClick={() => toggleComments(post._id)}>
                  <span className="action-icon"><FaComment /></span>
                  <span className="action-count">{post.comments?.length || 0}</span>
                </button>
                <button className="action-btn" onClick={() => handleShare(post._id)} title="Compartir"><span className="action-icon"><FaShareAlt /></span></button>
              </div>

              {/* Sección de Comentarios Desplegable */}
              {openComments[post._id] && (
                <div className="community-comments-section">
                  <div className="comments-list">
                    {post.comments?.length > 0 ? (
                      post.comments.map((comment, idx) => (
                        <div key={comment._id || idx} className="comment-item">
                          <div className="comment-item-content">
                            <strong>{comment.authorName}</strong>: {comment.content}
                          </div>
                          {user && user.email === comment.authorEmail && (
                            <button
                              className="comment-delete-btn"
                              onClick={() => handleDeleteComment(post._id, comment._id)}
                              title="Eliminar comentario"
                              aria-label="Eliminar comentario"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      ))
                    ) : <p className="no-comments">Sé el primero en comentar.</p>}
                  </div>

                  {isLogged && (
                    <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="comment-form">
                      <label htmlFor={`comment-input-${post._id}`} className="visually-hidden">Escribí un comentario</label>
                      <input
                        id={`comment-input-${post._id}`}
                        type="text"
                        placeholder="Escribí un comentario..."
                        className="community-input comment-input"
                        value={commentText[post._id] || ""}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                        disabled={submittingComment[post._id]}
                      />
                      <button type="submit" className="btn-comment" disabled={submittingComment[post._id]}>Enviar</button>
                    </form>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Community;
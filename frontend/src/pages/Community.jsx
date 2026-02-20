import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
  "General",
  "Consejos CV",
  "Entrevistas",
  "Networking",
  "Ofertas Laborales",
  "Dudas Técnicas"
];

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
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      addToast("Hubo un problema al publicar. Intentalo de nuevo.", "error");
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

  // ==========================================
  // 📦 RENDERIZADO (JSX)
  // ==========================================
  return (
    <section className="community">
      <div className="community-header">
        <h2>Comunidad JOBLU</h2>
        <p className="community-subtitle">Compartí tus experiencias, dudas y tips con otros profesionales.</p>
      </div>

      {/* --- Sección: Crear Publicación --- */}
      <div className="community-create-card">
        <h3 className="community-create-title">Crear nueva publicación</h3>
        {!isLogged && (
          <div className="community-alert-info">💡 Para publicar necesitas <Link to="/login">iniciar sesión</Link>.</div>
        )}

        <form onSubmit={handleCreatePost} className="community-form">
          <label htmlFor="post-title" className="visually-hidden">Título del post</label>
          <input
            id="post-title"
            type="text"
            placeholder="Título (ej: ¿Cómo responder sobre debilidades?)"
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
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <label htmlFor="post-content" className="visually-hidden">Contenido del post</label>
          <textarea
            id="post-content"
            placeholder="Escribí acá tu consulta o aporte..."
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
            {isSubmitting ? "Publicando..." : "Publicar Post"}
          </button>
        </form>
      </div>

      {/* --- Sección: Feed de la Comunidad --- */}
      <h3 className="community-list-title">Últimas conversaciones</h3>

      {loading ? (
        <div className="community-loading"><div className="spinner"></div> Cargando comunidad...</div>
      ) : posts.length === 0 ? (
        <div className="community-empty"><p>Todavía no hay nada por acá. ¡Sé el primero en romper el hielo! 🧊🔨</p></div>
      ) : (
        <div className="community-list">
          {posts.map((post) => (
            <article key={post._id} className="community-post">
              <div className="community-post-header">
                <span className="community-category-badge">{post.category || "General"}</span>
                <div className="community-post-meta">
                  <span aria-hidden="true">👤</span>
                  <span>{post.authorName || "Anónimo"}</span>
                </div>
              </div>

              <div className="post-main">
                <Link to={`/comunidad/${post._id}`} className="community-post-title">{post.title}</Link>
                <p className="community-post-excerpt">{post.content}</p>
              </div>

              {/* Fecha del post - estilo Twitter */}
              <div className="community-post-date">
                {formatRelativeDate(post.createdAt)}
              </div>

              {/* Acciones del Post */}
              <div className="post-actions">
                <button className={`action-btn ${user && post.likedBy?.includes(user.id) ? "liked" : ""}`} onClick={() => handleLike(post._id)}>
                  <span className="action-icon">{user && post.likedBy?.includes(user.id) ? "❤️" : "🤍"}</span>
                  <span className="action-count">{post.likedBy?.length || 0}</span>
                </button>
                <button className="action-btn" onClick={() => toggleComments(post._id)}>
                  <span className="action-icon">💬</span>
                  <span className="action-count">{post.comments?.length || 0}</span>
                </button>
                <button className="action-btn" onClick={() => handleShare(post._id)} title="Compartir"><span className="action-icon">🔗</span></button>
              </div>

              {/* Sección de Comentarios Desplegable */}
              {openComments[post._id] && (
                <div className="community-comments-section">
                  <div className="comments-list">
                    {post.comments?.length > 0 ? (
                      post.comments.map((comment, idx) => (
                        <div key={idx} className="comment-item"><strong>{comment.authorName}</strong>: {comment.content}</div>
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
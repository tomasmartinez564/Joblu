import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext"; // 🔔 Importamos el hook
import API_BASE_URL from "../config/api";
import "../styles/community.css";
import { formatDate } from "../utils/dateUtils";

// Categorías disponibles
const CATEGORIES = [
  "General",
  "Consejos CV",
  "Entrevistas",
  "Networking",
  "Ofertas Laborales",
  "Dudas Técnicas"
];

function Community({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // States para el formulario
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States para comentarios (mapa pid -> booleano/texto)
  const [openComments, setOpenComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  const { addToast } = useToast(); // 🔔 Instanciamos
  const isLogged = !!user;

  // Cargar Posts
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

  // Crear Post
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      addToast("El título y contenido son obligatorios", "info");
      return;
    }

    if (!isLogged) {
      addToast("Debes iniciar sesión para publicar", "info");
      return;
    }

    setIsSubmitting(true);
    const authorName = user?.name || "Usuario anónimo";
    const authorEmail = user?.email || "";

    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        },
        body: JSON.stringify({
          authorName,
          authorEmail,
          title: title.trim(),
          content: content.trim(),
          category
        }),
      });

      if (!res.ok) throw new Error("Error al crear post");

      const newPost = await res.json();

      setPosts((prev) => [newPost, ...prev]); // Agregamos arriba
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

  // Manejar Likes (❤️)
  const handleLike = async (postId) => {
    if (!isLogged) {
      addToast("Debes iniciar sesión para dar like", "info");
      return;
    }

    const token = localStorage.getItem("joblu_token");
    if (!token) {
      addToast("Error de sesión. Por favor reconectate.", "error");
      return;
    }

    // 1. UI Optimista
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p._id !== postId) return p;

        const alreadyLiked = p.likedBy?.includes(user.id);
        let newLikedBy = p.likedBy ? [...p.likedBy] : [];

        if (alreadyLiked) {
          newLikedBy = newLikedBy.filter((uid) => uid !== user.id);
        } else {
          newLikedBy.push(user.id);
        }

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

      const updatedData = await res.json();

      setPosts((prev) =>
        prev.map(p => p._id === postId ? { ...p, likedBy: updatedData.likedBy } : p)
      );

    } catch (error) {
      addToast("No pudimos registrar tu like", "error");
    }
  };

  // Toggle Comentarios
  const toggleComments = (postId) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Manejar Comentario
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!isLogged) {
      addToast("Debes iniciar sesión para comentar", "info");
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

      // Actualizar post en la lista
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p));

      // Limpiar input
      setCommentText(prev => ({ ...prev, [postId]: "" }));
      addToast("Comentario agregado", "success");

    } catch (err) {
      addToast("Error al enviar comentario", "error");
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Compartir Post (📋)
  const handleShare = (postId) => {
    const url = `${window.location.origin}/comunidad/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast("Enlace copiado al portapapeles 📋", "success");
    });
  };



  return (
    <section className="community">
      <div className="community-header">
        <h2>Comunidad Joblu</h2>
        <p className="community-subtitle">
          Compartí tus experiencias, dudas y tips con otros profesionales.
        </p>
      </div>

      {/* Formulario */}
      <div className="community-create-card">
        <h3 className="community-create-title">Crear nueva publicación</h3>

        {!isLogged && (
          <div className="community-alert-info">
            💡 Para publicar necesitas <Link to="/login">iniciar sesión</Link>.
          </div>
        )}

        <form onSubmit={handleCreatePost} className="community-form">
          <input
            type="text"
            placeholder="Título (ej: ¿Cómo responder sobre debilidades?)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="community-input"
            disabled={isSubmitting || !isLogged}
          />

          <select
            className="community-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting || !isLogged}
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <textarea
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

      {/* Feed */}
      <h3 className="community-list-title">Últimas conversaciones</h3>

      {loading ? (
        <div className="community-loading">
          <div className="spinner"></div> Cargando comunidad...
        </div>
      ) : posts.length === 0 ? (
        <div className="community-empty">
          <p>Todavía no hay nada por acá. ¡Sé el primero en romper el hielo! 🧊🔨</p>
        </div>
      ) : (
        <div className="community-list">
          {posts.map((post) => (
            <article key={post._id} className="community-post">
              <div className="community-post-header">
                <span className="community-category-badge">{post.category || "General"}</span>
                <div className="community-post-meta">
                  <span>👤 {post.authorName || "Anónimo"}</span>
                  <span>📅 {formatDate(post.createdAt)}</span>
                </div>
              </div>

              <div className="post-main">
                <Link to={`/comunidad/${post._id}`} className="community-post-title">
                  {post.title}
                </Link>

                <p className="community-post-excerpt">
                  {post.content}
                </p>
              </div>

              {/* Footer de Acciones */}
              <div className="post-actions">
                <button
                  className={`action-btn ${user && post.likedBy?.includes(user.id) ? "liked" : ""}`}
                  onClick={() => handleLike(post._id)}
                  title="Me gusta"
                >
                  <span className="action-icon">
                    {user && post.likedBy?.includes(user.id) ? "❤️" : "🤍"}
                  </span>
                  <span className="action-count">
                    {post.likedBy?.length || 0}
                  </span>
                </button>

                <button
                  className="action-btn"
                  onClick={() => toggleComments(post._id)}
                  title="Comentarios"
                >
                  <span className="action-icon">💬</span>
                  <span className="action-count">{post.comments?.length || 0}</span>
                </button>

                <button
                  className="action-btn"
                  onClick={() => handleShare(post._id)}
                  title="Compartir"
                >
                  <span className="action-icon">🔗</span>
                </button>
              </div>

              {/* Sección Comentarios */}
              {openComments[post._id] && (
                <div className="community-comments-section">
                  <div className="comments-list">
                    {post.comments?.length > 0 ? (
                      post.comments.map((comment, idx) => (
                        <div key={idx} className="comment-item">
                          <strong>{comment.authorName}</strong>: {comment.content}
                        </div>
                      ))
                    ) : (
                      <p className="no-comments">Sé el primero en comentar.</p>
                    )}
                  </div>

                  {isLogged && (
                    <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="comment-form">
                      <input
                        type="text"
                        placeholder="Escribe un comentario..."
                        className="community-input comment-input"
                        value={commentText[post._id] || ""}
                        onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                        disabled={submittingComment[post._id]}
                      />
                      <button type="submit" className="btn-comment" disabled={submittingComment[post._id]}>
                        Enviar
                      </button>
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
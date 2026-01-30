import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext"; // 🔔 Importamos el hook
import API_BASE_URL from "../config/api";
import "../styles/community.css";

function Community({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // States para el formulario
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    const authorName = user?.name || "Usuario anónimo";
    const authorEmail = user?.email || "";

    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorEmail,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) throw new Error("Error al crear post");

      const newPost = await res.json();

      setPosts((prev) => [newPost, ...prev]); // Agregamos arriba
      setTitle("");
      setContent("");
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
      // 2. Llamada al backend
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // body: JSON.stringify({ action: "like" }), // Ya no es necesario 'action'
      });

      if (!res.ok) throw new Error("Error al dar like");

      const updatedData = await res.json();

      // 3. Confirmación con datos reales del server (opcional, por si la concurrencia)
      // updatedData trae: { _id, likes, likedBy, ... }
      setPosts((prev) =>
        prev.map(p => p._id === postId ? { ...p, likedBy: updatedData.likedBy } : p)
      );

    } catch (error) {
      // Revertir en caso de error
      // Para simplificar, podríamos recargar los posts o deshacer localmente
      // Aquí recargamos, aunque es brusco, asegura consistencia
      addToast("No pudimos registrar tu like", "error");
      // idealmente rollback manual
    }
  };

  // Compartir Post (📋)
  const handleShare = (postId) => {
    const url = `${window.location.origin}/comunidad/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast("Enlace copiado al portapapeles 📋", "success");
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
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
            💡 Publicarás como <strong>Usuario anónimo</strong>. <Link to="/login">Iniciá sesión</Link> para usar tu nombre.
          </div>
        )}

        <form onSubmit={handleCreatePost} className="community-form">
          <input
            type="text"
            placeholder="Título (ej: ¿Cómo responder sobre debilidades?)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="community-input"
            disabled={isSubmitting}
          />

          <textarea
            placeholder="Escribí acá tu consulta o aporte..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="community-textarea community-input"
            disabled={isSubmitting}
          />

          <button
            type="submit"
            className={`btn-joblu ${isSubmitting ? "btn-disabled" : ""}`}
            disabled={isSubmitting}
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
              <div className="post-main">
                <Link to={`/comunidad/${post._id}`} className="community-post-title">
                  {post.title}
                </Link>

                <p className="community-post-excerpt">
                  {post.content.length > 140
                    ? post.content.slice(0, 140) + "..."
                    : post.content}
                </p>

                <div className="community-post-meta">
                  <span>👤 {post.authorName || "Anónimo"}</span>
                  <span>📅 {formatDate(post.createdAt)}</span>
                </div>
              </div>

              {/* Footer de Acciones (Like y Compartir) */}
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
                  onClick={() => handleShare(post._id)}
                  title="Compartir"
                >
                  <span className="action-icon">🔗</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Community;
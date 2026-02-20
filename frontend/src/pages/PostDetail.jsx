import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// --- Estilos y Utilidades ---
import "../styles/postdetail.css";
import { formatDate } from "../utils/dateUtils";

// --- Contexto y Configuración ---
import { useToast } from "../context/ToastContext";
import API_BASE_URL from "../config/api";

// ==========================================
// 📋 CONSTANTES Y HELPERS DE PERSISTENCIA
// ==========================================
const STORAGE_KEY = "joblu_liked_posts";

const getInitialLikedPosts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ==========================================
// 📝 PÁGINA: DETALLE DE POST (PostDetail)
// ==========================================
function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // --- 1. Estados: Datos del Post ---
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- 2. Estados: Gestión de Comentarios ---
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // --- 3. Estados: UI (Likes) ---
  const [deleting, setDeleting] = useState(false);

  // --- 4. Lógica Derivada (Calculada) ---
  const isLiked = post && user && post.likedBy?.includes(user.id);
  const likeCount = post ? (post.likedBy?.length || 0) : 0;
  const canDelete = user && post && post.authorEmail && user.email === post.authorEmail;

  // ==========================================
  // 🧠 EFECTOS (Efectos de carga y sincronización)
  // ==========================================

  /**
   * Carga los datos del post al montar el componente.
   */
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/community/posts/${id}`);
        if (!res.ok) throw new Error("No se pudo obtener el post.");
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
        setError("Hubo un problema al cargar el post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // ==========================================
  // 📡 MANEJADORES DE EVENTOS (Handlers)
  // ==========================================

  /**
   * Gestiona la lógica de dar/quitar like.
   */
  const handleToggleLike = async () => {
    if (!post || !user) {
      if (!user) addToast("Debés iniciar sesión para dar like", "info");
      return;
    }

    // Actualización Optimista
    const alreadyLiked = post.likedBy?.includes(user.id);
    let newLikedBy = post.likedBy ? [...post.likedBy] : [];

    if (alreadyLiked) {
      newLikedBy = newLikedBy.filter(uid => uid !== user.id);
    } else {
      newLikedBy.push(user.id);
    }

    setPost(prev => ({ ...prev, likedBy: newLikedBy }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${post._id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        },
        body: JSON.stringify({ action: alreadyLiked ? "unlike" : "like" }),
      });

      if (!res.ok) throw new Error("No se pudo actualizar el like.");

      // Confirmamos con datos del servidor si es necesario, 
      // pero el optimista suele ser suficiente para UX rápida.
    } catch (err) {
      console.error(err);
      addToast("Hubo un problema al actualizar el like.", "error");
      // Revertir en caso de error
      setPost(prev => ({ ...prev, likedBy: post.likedBy }));
    }
  };

  /**
   * Envía un nuevo comentario al post.
   */
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      addToast("Escribí un comentario antes de publicar.", "info");
      return;
    }

    try {
      setCommentLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        },
        body: JSON.stringify({
          authorName: user?.name || "Usuario anónimo",
          authorEmail: user?.email || "",
          content: commentContent,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo agregar el comentario.");
      }

      const updatedPost = await res.json();
      setPost(updatedPost);
      setCommentContent("");
      addToast("Comentario agregado", "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Hubo un problema al comentar.", "error");
    } finally {
      setCommentLoading(false);
    }
  };

  /**
   * Elimina la publicación (Solo autores).
   */
  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que querés eliminar este post?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        }
      });
      if (!res.ok) throw new Error("No se pudo borrar el post.");

      addToast("Post eliminado correctamente", "success");
      navigate("/comunidad");
    } catch (err) {
      console.error(err);
      addToast("Hubo un problema al borrar el post.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // 📦 RENDERIZADO (JSX)
  // ==========================================

  // --- Estados de Carga y Error ---
  if (loading) {
    return (
      <section className="community postdetail">
        <p className="postdetail-status">Cargando post...</p>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="community postdetail">
        <p className="postdetail-status">{error || "Post no encontrado."}</p>
        <Link to="/comunidad" className="postdetail-back-link">← Volver a la comunidad</Link>
      </section>
    );
  }

  return (
    <section className="community postdetail">
      {/* Navegación de regreso */}
      <div className="postdetail-back">
        <Link to="/comunidad" className="postdetail-back-link">← Volver a la comunidad</Link>
      </div>

      {/* Cabecera del Post */}
      <h2 className="postdetail-title">{post.title}</h2>
      <p className="postdetail-meta">
        por {post.authorName || "Usuario"} · {formatDate(post.createdAt)}
      </p>

      {/* Interacción: Likes */}
      <div className="postdetail-like-row">
        <button type="button" onClick={handleToggleLike} className="postdetail-like-button">
          {isLiked ? "💙 Quitar like" : "🤍 Me gusta"}
        </button>
        <span className="postdetail-like-count">
          {likeCount} {(likeCount === 1) ? "like" : "likes"}
        </span>
      </div>

      {/* Cuerpo del Post */}
      <div className="postdetail-content">
        {post.content}
      </div>

      {/* Acciones de Autor */}
      {canDelete && (
        <button onClick={handleDelete} disabled={deleting} className="postdetail-delete-btn">
          {deleting ? "Eliminando..." : "Eliminar post"}
        </button>
      )}

      {/* --- Sección de Comentarios --- */}
      <section className="postdetail-comments">
        <h3 className="postdetail-comments-title">Comentarios</h3>

        {/* Lista de Comentarios */}
        {(!post.comments || post.comments.length === 0) ? (
          <p className="postdetail-comments-empty">
            Todavía no hay comentarios. ¡Sé la primera persona en comentar!
          </p>
        ) : (
          <ul className="postdetail-comments-list">
            {post.comments.map((c, index) => (
              <li key={index} className="postdetail-comment">
                <p className="postdetail-comment-header">
                  <span className="postdetail-comment-author">{c.authorName || "Usuario anónimo"}</span>
                  <span className="postdetail-comment-meta">{formatDate(c.createdAt)}</span>
                </p>
                <p className="postdetail-comment-body">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Formulario de Comentarios */}
        <form onSubmit={handleAddComment} className="community-form community-form--compact">
          <textarea
            placeholder="Escribí tu comentario..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            rows={3}
            className="community-textarea community-input"
          />
          <button type="submit" disabled={commentLoading} className="btn-joblu">
            {commentLoading ? "Publicando..." : "Publicar comentario"}
          </button>
        </form>
      </section>
    </section>
  );
}

export default PostDetail;
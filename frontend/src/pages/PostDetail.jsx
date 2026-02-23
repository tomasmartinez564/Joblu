import { useEffect, useState } from "react";
import { FaExclamationTriangle, FaTrash, FaHeart, FaRegHeart } from "react-icons/fa";
import { useParams, useNavigate, Link } from "react-router-dom";

// --- Estilos y Utilidades ---
import "../styles/postdetail.css";
import "../styles/jobs-detail.css";
import { formatDate } from "../utils/dateUtils";

import { useToast } from "../context/ToastContext";
import API_BASE_URL from "../config/api";
import { userService } from "../services/userService";
import UserProfilePopup from "../components/community/UserProfilePopup";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- 4. Estados: Modal Perfil de Usuario ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfileData, setSelectedProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // --- 5. Lógica Derivada (Calculada) ---
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
   * Abre el perfil público del autor.
   */
  const handleAuthorClick = async (email) => {
    if (!email) {
      addToast("Usuario sin email asociado", "info");
      return;
    }

    setIsProfileOpen(true);
    setIsLoadingProfile(true);
    setSelectedProfileData(null);
    try {
      const data = await userService.getPublicProfile(email);
      setSelectedProfileData(data);
    } catch (err) {
      console.error(err);
      addToast("Error al cargar el perfil del usuario.", "error");
    } finally {
      setIsLoadingProfile(false);
    }
  };

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
    if (!showDeleteModal) {
      setShowDeleteModal(true);
      return;
    }
    setShowDeleteModal(false);

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

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/community/posts/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar comentario");
      }

      const updatedPost = await res.json();
      setPost(updatedPost);
      addToast("Comentario eliminado", "success");
    } catch (err) {
      addToast(err.message, "error");
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
        <Link to="/comunidad" className="btn-secondary postdetail-back-link">← Volver a la comunidad</Link>
      </section>
    );
  }

  return (
    <section className="community postdetail">
      {/* Navegación de regreso */}
      <div className="postdetail-back">
        <Link to="/comunidad" className="btn-secondary postdetail-back-link">← Volver a la comunidad</Link>
      </div>

      {/* Cabecera del Post */}
      <h2 className="postdetail-title">{post.title}</h2>
      <p
        className="postdetail-meta"
        onClick={() => handleAuthorClick(post.authorEmail)}
        style={{ cursor: "pointer", display: "inline-block" }}
        title="Ver perfil"
      >
        por <strong>{post.authorName || "Usuario"}</strong> · {formatDate(post.createdAt)}
      </p>

      {/* Interacción: Likes */}
      <div className="postdetail-like-row">
        <button
          type="button"
          onClick={handleToggleLike}
          className={`postdetail-like-button${isLiked ? " is-liked" : ""}`}
        >
          {isLiked ? <><FaHeart /> Quitar like</> : <><FaRegHeart /> Me gusta</>}
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

      {/* Modal Confirmación Eliminar Post */}
      {showDeleteModal && (
        <div className="job-apply-modal-overlay">
          <div className="job-apply-modal">
            <div className="job-apply-modal-icon" style={{ color: '#dc2626' }}><FaExclamationTriangle /></div>
            <h3 style={{ color: '#dc2626' }}>Eliminar post</h3>
            <p>¿Seguro que querés eliminar este post? Esta acción no se puede deshacer.</p>
            <div className="job-apply-modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="cv-clear-confirm-btn" onClick={handleDelete}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
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
              <li key={c._id || index} className="postdetail-comment">
                <div className="postdetail-comment-row">
                  <div>
                    <p className="postdetail-comment-header">
                      <span
                        className="postdetail-comment-author"
                        onClick={() => handleAuthorClick(c.authorEmail)}
                        style={{ cursor: "pointer" }}
                        title="Ver perfil"
                      >
                        {c.authorName || "Usuario anónimo"}
                      </span>
                      <span className="postdetail-comment-meta">{formatDate(c.createdAt)}</span>
                    </p>
                    <p className="postdetail-comment-body">{c.content}</p>
                  </div>
                  {user && user.email === c.authorEmail && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => handleDeleteComment(c._id)}
                      title="Eliminar comentario"
                      aria-label="Eliminar comentario"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment(e);
              }
            }}
            rows={3}
            className="community-textarea community-input"
          />
          <button type="submit" disabled={commentLoading} className="hero-cta btn-joblu">
            {commentLoading ? "Publicando..." : "Publicar comentario"}
          </button>
        </form>
      </section>

      {/* Modal de Perfil de Usuario */}
      <UserProfilePopup
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profileData={selectedProfileData}
        isLoading={isLoadingProfile}
      />
    </section>
  );
}

export default PostDetail;
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "../styles/postdetail.css";
import API_BASE_URL from "../config/api";
import { formatDate } from "../utils/dateUtils";


const STORAGE_KEY = "joblu_liked_posts";

const getInitialLikedPosts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [likedPosts, setLikedPosts] = useState(() => getInitialLikedPosts());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likedPosts));
  }, [likedPosts]);

  const isLiked = post && likedPosts.includes(post._id);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/community/posts/${id}`);
        if (!res.ok) {
          throw new Error("No se pudo obtener el post.");
        }
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

  const canDelete =
    user && post && post.authorEmail && user.email && user.email === post.authorEmail;

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

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      addToast("Escribí un comentario antes de publicar.", "info");
      return;
    }

    const authorName = user?.name || "Usuario anónimo";
    const authorEmail = user?.email || "";

    try {
      setCommentLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/api/community/posts/${id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
          },
          body: JSON.stringify({
            authorName,
            authorEmail,
            content: commentContent,
          }),
        }
      );

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

  const handleToggleLike = async () => {
    if (!post) return;

    const alreadyLiked = likedPosts.includes(post._id);
    const action = alreadyLiked ? "unlike" : "like";

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/community/posts/${post._id}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("joblu_token")}`
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!res.ok) {
        throw new Error("No se pudo actualizar el like.");
      }

      const updatedPost = await res.json();

      setPost((prev) =>
        prev ? { ...prev, likes: updatedPost.likes } : prev
      );

      setLikedPosts((prev) =>
        alreadyLiked
          ? prev.filter((id) => id !== post._id)
          : [...prev, post._id]
      );
    } catch (err) {
      console.error(err);
      addToast("Hubo un problema al actualizar el like.", "error");
    }

  };

  // Estados de carga y error
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
        <p className="postdetail-status">
          {error || "Post no encontrado."}
        </p>
        <Link to="/comunidad" className="postdetail-back-link">
          ← Volver a la comunidad
        </Link>
      </section>
    );
  }

  return (
    <section className="community postdetail">
      {/* Botón claro para volver */}
      <div className="postdetail-back">
        <Link to="/comunidad" className="postdetail-back-link">
          ← Volver a la comunidad
        </Link>
      </div>

      {/* Título y meta */}
      <h2 className="postdetail-title">{post.title}</h2>

      <p className="postdetail-meta">
        por {post.authorName || "Usuario"} · {formatDate(post.createdAt)}
      </p>

      {/* Likes */}
      <div className="postdetail-like-row">
        <button
          type="button"
          onClick={handleToggleLike}
          className="postdetail-like-button"
        >
          {isLiked ? "💙 Quitar like" : "🤍 Me gusta"}
        </button>

        <span className="postdetail-like-count">
          {(post.likes ?? 0)} like{(post.likes ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      {/* Contenido principal del post */}
      <div className="postdetail-content">
        {post.content}
      </div>

      {/* Botón de borrar (solo autor) */}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="postdetail-delete-btn"
        >
          {deleting ? "Eliminando..." : "Eliminar post"}
        </button>
      )}

      {/* Sección de comentarios */}
      <section className="postdetail-comments">
        <h3 className="postdetail-comments-title">Comentarios</h3>

        {/* Lista de comentarios */}
        {(!post.comments || post.comments.length === 0) ? (
          <p className="postdetail-comments-empty">
            Todavía no hay comentarios. ¡Sé la primera persona en comentar!
          </p>
        ) : (
          <ul className="postdetail-comments-list">
            {post.comments.map((c, index) => (
              <li key={index} className="postdetail-comment">
                <p className="postdetail-comment-header">
                  <span className="postdetail-comment-author">
                    {c.authorName || "Usuario anónimo"}
                  </span>
                  <span className="postdetail-comment-meta">
                    {formatDate(c.createdAt)}
                  </span>
                </p>
                <p className="postdetail-comment-body">{c.content}</p>
              </li>
            ))}
          </ul>
        )}

        {/* Formulario para agregar comentario */}
        <form
          onSubmit={handleAddComment}
          className="community-form community-form--compact"
        >
          <textarea
            placeholder="Escribí tu comentario..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            rows={3}
            className="community-textarea community-input"
          />

          <button
            type="submit"
            disabled={commentLoading}
            className="btn-joblu"
          >
            {commentLoading ? "Publicando..." : "Publicar comentario"}
          </button>
        </form>
      </section>
    </section>
  );
}

export default PostDetail;

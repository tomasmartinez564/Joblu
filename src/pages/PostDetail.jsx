import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

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

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Estado para comentarios
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [likedPosts, setLikedPosts] = useState(() => getInitialLikedPosts());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likedPosts));
  }, [likedPosts]);

  const isLiked = post && likedPosts.includes(post._id);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/community/posts/${id}`
        );
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

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  // Puede borrar si su email coincide con el del autor
  const canDelete =
    user && post && post.authorEmail && user.email && user.email === post.authorEmail;

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que querés eliminar este post?")) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/community/posts/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("No se pudo borrar el post.");
      // Volver a la lista de comunidad
      navigate("/comunidad");
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al borrar el post.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError("");

    if (!commentContent.trim()) {
      setCommentError("Escribí un comentario antes de publicar.");
      return;
    }

    const authorName = user?.name || "Usuario anónimo";
    const authorEmail = user?.email || "";

    try {
      setCommentLoading(true);

      const res = await fetch(
        `http://localhost:3000/api/community/posts/${id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      const newComment = await res.json();

      // Actualizamos el estado local del post con el nuevo comentario
      setPost((prev) =>
        prev
          ? { ...prev, comments: [...(prev.comments || []), newComment] }
          : prev
      );

      setCommentContent("");
    } catch (err) {
      console.error(err);
      setCommentError(err.message || "Hubo un problema al comentar.");
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
        `http://localhost:3000/api/community/posts/${post._id}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      if (!res.ok) {
        throw new Error("No se pudo actualizar el like.");
      }

      const updatedPost = await res.json();

      // Actualizar el post con el nuevo número de likes
      setPost((prev) =>
        prev ? { ...prev, likes: updatedPost.likes } : prev
      );

      // Actualizar qué posts están likeados en este navegador
      setLikedPosts((prev) =>
        alreadyLiked
          ? prev.filter((id) => id !== post._id)
          : [...prev, post._id]
      );
    } catch (err) {
      console.error(err);
      alert("Hubo un problema al actualizar el like.");
    }
  };


  if (loading) {
    return (
      <section className="community">
        <p>Cargando post...</p>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="community">
        <p>{error || "Post no encontrado."}</p>
        <Link to="/comunidad" style={{ fontSize: "0.9rem" }}>
          ← Volver a la comunidad
        </Link>
      </section>
    );
  }

  return (
    <section className="community">
      <Link
        to="/comunidad"
        style={{ fontSize: "0.9rem", color: "#6b7280", textDecoration: "none" }}
      >
        ← Volver a la comunidad
      </Link>

      <h2 style={{ marginTop: "0.75rem" }}>{post.title}</h2>

      <p
        style={{
          margin: "0.25rem 0 0.75rem",
          fontSize: "0.9rem",
          color: "#6b7280",
        }}
      >
        por {post.authorName || "Usuario"} · {formatDate(post.createdAt)}
      </p>

            <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={handleToggleLike}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            fontSize: "0.95rem",
          }}
        >
          {isLiked ? "💙 Quitar like" : "🤍 Me gusta"}
        </button>

        <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          {(post.likes ?? 0)} like{(post.likes ?? 0) === 1 ? "" : "s"}
        </span>
      </div>


      <div
        style={{
          padding: "1rem",
          borderRadius: "0.75rem",
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          whiteSpace: "pre-wrap",
        }}
      >
        {post.content}
      </div>

      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            marginTop: "1rem",
            padding: "0.45rem 0.9rem",
            borderRadius: "999px",
            border: "none",
            background: "#b91c1c",
            color: "#ffffff",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          {deleting ? "Eliminando..." : "Eliminar post"}
        </button>
      )}

      {/* Sección de comentarios */}
      <section style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Comentarios</h3>

        {/* Lista de comentarios */}
        {(!post.comments || post.comments.length === 0) ? (
          <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
            Todavía no hay comentarios. ¡Sé la primera persona en comentar! 😊
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {post.comments.map((c, index) => (
              <li
                key={index}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    fontWeight: 600,
                  }}
                >
                  {c.authorName || "Usuario anónimo"}
                  {" · "}
                  <span style={{ fontWeight: 400, color: "#6b7280" }}>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : ""}
                  </span>
                </p>
                <p
                  style={{
                    margin: "0.25rem 0 0",
                    fontSize: "0.9rem",
                  }}
                >
                  {c.content}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Formulario para agregar comentario */}
        <form
          onSubmit={handleAddComment}
          className="community-form community-form--compact"
        >
          {commentError && (
            <p className="community-error-text">
              {commentError}
            </p>
          )}

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

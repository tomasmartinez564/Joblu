import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


function Community({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const isLogged = !!user;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/community/posts");

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Error al listar posts:", res.status, errorData);
          throw new Error(errorData.error || "No se pudieron cargar los posteos.");
        }

        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
        setError("Hubo un problema al cargar los posteos.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);


  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Completá el título y el contenido.");
      return;
    }

    const authorName = user?.name || "Usuario anónimo";
    const authorEmail = user?.email || "";

    try {
      const res = await fetch("http://localhost:3000/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorEmail,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear el post.");
      }

      const newPost = await res.json();

      // Agregamos el nuevo post al inicio de la lista
      setPosts((prev) => [newPost, ...prev]);
      setTitle("");
      setContent("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Hubo un problema al crear el post.");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <section className="community">
      <h2>Comunidad Joblu</h2>
      <p className="community-subtitle">
        Un espacio para compartir experiencias laborales, tips y consejos sobre CVs y entrevistas.
      </p>

      {/* Formulario para crear posteo */}
    <div className="community-create-card">
      <h3 className="community-create-title">Crear un nuevo post</h3>

      {!isLogged && (
        <p className="community-helper-text">
          Para publicar con tu nombre, iniciá sesión en Joblu. Si no, se usará
          "Usuario anónimo".
        </p>
      )}

      {error && <p className="community-error-text">{error}</p>}

      <form onSubmit={handleCreatePost} className="community-form">
        <input
          type="text"
          placeholder="Título del post (ej: Tip para entrevistas en IT)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="community-input"
        />

        <textarea
          placeholder="Escribí tu experiencia, consejo o pregunta..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="community-textarea community-input"
        />

        <button type="submit" className="btn-joblu">
          Publicar
        </button>
      </form>
    </div>


      {/* Lista de posteos */}
      <h3 style={{ marginTop: "0.5rem" }}>Últimos posteos</h3>

      {loading ? (
        <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>Cargando posteos...</p>
      ) : posts.length === 0 ? (
        <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
          Todavía no hay posteos. ¡Sé la primera persona en compartir algo! 😊
        </p>
      ) : (
        <div className="community-list">
        {posts.map((post) => (
          <article key={post._id} className="community-post">
            <Link
              to={`/comunidad/${post._id}`}
              style={{
                fontWeight: "600",
                textDecoration: "none",
                color: "inherit",
                display: "inline-block",
                marginBottom: "0.25rem",
              }}
            >
              {post.title}
            </Link>

            <p
              style={{
                margin: "0.25rem 0",
                fontSize: "0.9rem",
                color: "#6b7280",
              }}
            >
              por {post.authorName || "Usuario"} · {formatDate(post.createdAt)}
            </p>

            <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151" }}>
              {post.content.length > 120
                ? post.content.slice(0, 120) + "..."
                : post.content}
            </p>
          </article>
        ))}

          
        </div>
      )}
    </section>
  );
}

export default Community;

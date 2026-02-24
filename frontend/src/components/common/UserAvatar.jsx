import React, { useState, useEffect } from "react";

const UserAvatar = ({ src, name, className, style, alt }) => {
    const [imgError, setImgError] = useState(false);

    // Reiniciar el error si cambia la URL (por ej. cuando el usuario sube un avatar nuevo)
    useEffect(() => {
        setImgError(false);
    }, [src]);

    const getInitials = (nameStr) => {
        if (!nameStr || typeof nameStr !== "string") return "?";
        return nameStr.charAt(0).toUpperCase();
    };

    const hasImage = src && !imgError;

    if (hasImage) {
        return (
            <img
                src={src}
                alt={alt || name || "Avatar"}
                className={className}
                style={style}
                onError={() => setImgError(true)}
            />
        );
    }

    // Fallback (Inicial del nombre o un placeholder)
    return (
        <div
            className={className}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--joblu-bg-main, #f3f4f6)",
                color: "var(--joblu-primary, #6337b7)",
                fontWeight: "bold",
                fontSize: "1.2em",
                overflow: "hidden",
                ...style,
            }}
            title={alt || name}
        >
            {getInitials(name)}
        </div>
    );
};

export default UserAvatar;

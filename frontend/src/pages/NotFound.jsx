import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/notfound.css'

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-icon"></div>
            <h1 className="not-found-title">404</h1>
            <h2 className="not-found-message">¡Ups! Página no encontrada</h2>
            <p className="not-found-description">
                Parece que la página que buscás no existe o fue movida.
                No te preocupes, podés volver al inicio y seguir navegando.
            </p>

            <Link to="/" className="btn-joblu btn-not-found">
                Volver al Inicio
            </Link>
        </div>
    )
}

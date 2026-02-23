import React from "react";
import { FaUserCircle, FaMapMarkerAlt, FaBriefcase, FaStar, FaTimes } from "react-icons/fa";
import "../../styles/community.css"; // Ensure styles are defined here

const UserProfilePopup = ({ isOpen, onClose, profileData, isLoading }) => {
    if (!isOpen) return null;

    const getJobTypeLabel = (type) => {
        switch (type) {
            case 'remoto': return '100% Remoto';
            case 'hibrido': return 'Híbrido';
            case 'presencial': return 'Presencial';
            default: return 'No especificado';
        }
    };

    const getSeniorityLabel = (level) => {
        switch (level) {
            case 'trainee': return 'Trainee';
            case 'jr': return 'Junior';
            case 'ssr': return 'Semi-Senior';
            case 'sr': return 'Senior';
            default: return 'No especificado';
        }
    };

    return (
        <div className="profile-popup-overlay" onClick={onClose}>
            <div className="profile-popup-content" onClick={(e) => e.stopPropagation()}>
                <button className="profile-popup-close" onClick={onClose}>
                    <FaTimes />
                </button>

                {isLoading ? (
                    <div className="profile-popup-loading">
                        <div className="spinner"></div>
                        <p>Cargando perfil...</p>
                    </div>
                ) : profileData ? (
                    <div className="profile-popup-body">
                        <div className="profile-popup-header">
                            {profileData.avatar ? (
                                <img src={profileData.avatar} alt={profileData.name} className="profile-popup-avatar" />
                            ) : (
                                <FaUserCircle className="profile-popup-avatar-placeholder" />
                            )}
                            <h2 className="profile-popup-name">{profileData.name}</h2>
                        </div>

                        <div className="profile-popup-preferences">
                            <h3 className="preferences-title">Preferencias JOBLU</h3>

                            {profileData.preferences ? (
                                <ul className="preferences-list">
                                    <li>
                                        <FaMapMarkerAlt className="preference-icon" />
                                        <div className="preference-detail">
                                            <span className="preference-label">Modalidad:</span>
                                            <span className="preference-value">
                                                {getJobTypeLabel(profileData.preferences.jobType)}
                                            </span>
                                        </div>
                                    </li>
                                    <li>
                                        <FaBriefcase className="preference-icon" />
                                        <div className="preference-detail">
                                            <span className="preference-label">Seniority:</span>
                                            <span className="preference-value">
                                                {getSeniorityLabel(profileData.preferences.seniority)}
                                            </span>
                                        </div>
                                    </li>
                                    <li>
                                        <FaStar className="preference-icon" />
                                        <div className="preference-detail">
                                            <span className="preference-label">Áreas de interés:</span>
                                            <span className="preference-value">
                                                {profileData.preferences.areas && profileData.preferences.areas.length > 0
                                                    ? profileData.preferences.areas.join(", ")
                                                    : "No especificado"}
                                            </span>
                                        </div>
                                    </li>
                                </ul>
                            ) : (
                                <p className="no-preferences-msg">Este usuario aún no ha configurado sus preferencias JOBLU.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="profile-popup-error">
                        <p>No se pudo cargar la información del usuario.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfilePopup;

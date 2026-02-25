import User from "../models/User.js";

export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se subió ninguna imagen." });
        }

        const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: avatarUrl },
            { new: true }
        );

        res.json({ avatarUrl: user.avatar });
    } catch (err) {
        console.error("Error subiendo avatar:", err);
        res.status(500).json({ error: "Error al procesar la imagen." });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, jobType, seniority, areas } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        if (name !== undefined) user.name = name;
        if (jobType !== undefined) user.jobType = jobType;
        if (seniority !== undefined) user.seniority = seniority;
        if (areas !== undefined) user.areas = areas;

        await user.save();

        const userObj = user.toObject();
        delete userObj.password;

        res.json(userObj);
    } catch (err) {
        console.error("Error actualizando perfil:", err);
        res.status(500).json({ error: "Error al actualizar perfil" });
    }
};

export const getPublicProfile = async (req, res) => {
    try {
        const email = req.params.email;
        const user = await User.findOne({ email }).select("-password");

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({
            name: user.name,
            avatar: user.avatar,
            preferences: {
                jobType: user.jobType,
                seniority: user.seniority,
                areas: user.areas
            }
        });
    } catch (err) {
        console.error("Error obteniendo perfil de usuario:", err);
        res.status(500).json({ error: "Error al obtener el perfil" });
    }
};

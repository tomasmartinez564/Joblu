import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "El email ya está registrado." });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, name: newUser.name, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const userObj = newUser.toObject();
        delete userObj.password;

        res.status(201).json({
            message: "Usuario creado con éxito",
            token,
            user: userObj
        });
    } catch (err) {
        console.error("Error en registro:", err);
        res.status(500).json({ error: "Error al registrar el usuario" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const userObj = user.toObject();
        delete userObj.password;

        res.json({
            token,
            user: userObj
        });
    } catch (err) {
        console.error("Error en login:", err);
        res.status(500).json({ error: "Error al iniciar sesión" });
    }
};

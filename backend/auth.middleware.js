const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
require('dotenv').config();

// Inicializar la App de Firebase Admin (Nube via env o Local via JSON)
if (getApps().length === 0) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require(path.resolve(__dirname, 'serviceAccountKey.json'));

    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin SDK:', error.message);
  }
}

/**
 * Middleware para validar el Bearer Token enviado desde Angular
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se proporcionó token de autorización.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      nombre: decodedToken.name || decodedToken.email?.split('@')[0] || 'Usuario'
    };

    next();
  } catch (error) {
    console.error('❌ Error al verificar token:', error.message);
    return res.status(403).json({ error: 'Token no válido o expirado.' });
  }
};

module.exports = verifyToken;
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Brak tokenu autoryzacyjnego' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key');  
    req.user = { userId: decoded.userId };  
    console.log(decoded)
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Błąd autoryzacji' });
  }
};

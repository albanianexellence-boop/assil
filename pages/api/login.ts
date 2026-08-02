import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const filePath = path.join(process.cwd(), 'users.json');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let users: any[] = [];
    try {
      users = JSON.parse(fileContent);
    } catch (e) {
      return res.status(500).json({ message: 'Database error.' });
    }

    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

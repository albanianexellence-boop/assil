import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, email, prize } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const userData = {
      name,
      email,
      prize,
      timestamp: new Date().toISOString(),
    };

    const filePath = path.join(process.cwd(), 'users.json');

    let existingData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      try {
        existingData = JSON.parse(fileContent);
      } catch (e) {
        // If file is empty or corrupted, start fresh
        existingData = [];
      }
    }

    existingData.push(userData);

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

    return res
      .status(200)
      .json({ message: 'Account saved successfully', user: userData });
  } catch (error) {
    console.error('Error saving account:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

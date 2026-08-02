import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'users.json');

    if (!fs.existsSync(filePath)) {
      return res.status(200).json({ users: [] });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let users: any[] = [];
    try {
      users = JSON.parse(fileContent);
    } catch (e) {
      return res.status(500).json({ message: 'Database error.' });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

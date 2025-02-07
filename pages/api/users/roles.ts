import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();
const USERS_COLLECTION = '/registrations';

async function updateUserRole(
  userId: string,
  newRole: string,
): Promise<{ statusCode: number; msg: string }> {
  const docRef = db.collection(USERS_COLLECTION).doc(userId);
  const data = await docRef.get();
  if (!data.exists) {
    return {
      statusCode: 404,
      msg: 'User not found',
    };
  }
  const userData = data.data();
  await docRef.set({
    ...userData,
    user: {
      ...userData.user,
      permissions: [newRole],
    },
  });
  return {
    statusCode: 200,
    msg: 'Update completed',
  };
}

async function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  const { headers } = req;
  const userToken = headers['authorization'];
  const isAuthorized = await userIsAuthorized(userToken, ['super_admin']);

  if (!isAuthorized) {
    return res.status(403).json({
      statusCode: 403,
      msg: 'Request is not authorized to perform admin functionality',
    });
  }

  const { userId, newRole } = JSON.parse(req.body);

  const updateResult = await updateUserRole(userId, newRole);
  res.json(updateResult);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  if (method === 'POST') {
    return handlePostRequest(req, res);
  } else {
    return res.status(404).json({
      statusCode: 404,
      msg: 'Route not found',
    });
  }
}

import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../lib/admin/init';
import { userIsAuthorized } from '../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();

const USERS_COLLECTION = '/registrations';
const SCANTYPES_COLLECTION = '/scan-types';

async function getCheckInEventName() {
  const snapshot = await db.collection(SCANTYPES_COLLECTION).where('isCheckIn', '==', true).get();
  let checkInEventName = '';
  snapshot.forEach((doc) => {
    checkInEventName = doc.data().name;
  });
  return checkInEventName;
}

async function getStatsData() {
  let hackerCount = 0,
    adminCount = 0,
    superAdminCount = 0,
    checkedInCount = 0;
  const checkInEventName = await getCheckInEventName();
  const swagData: Record<string, number> = {};

  const snapshot = await db.collection(USERS_COLLECTION).get();
  snapshot.forEach((doc) => {
    const userData = doc.data();
    if (userData.scans) {
      userData.scans.forEach((scan: string) => {
        if (scan === checkInEventName) checkedInCount++;
        else {
          if (!swagData.hasOwnProperty(scan)) swagData[scan] = 0;
          swagData[scan]++;
        }
      });
    }

    let userPermission = '';
    if (userData.user && userData.user.permissions) {
      userPermission = userData.user.permissions[0];
    }

    switch (userPermission) {
      case 'super_admin': {
        superAdminCount++;
      }
      case 'admin': {
        adminCount++;
      }
      case 'hacker': {
        hackerCount++;
      }
    }
  });

  return {
    superAdminCount,
    checkedInCount,
    hackerCount,
    adminCount,
    swags: swagData,
  };
}

async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  const { headers } = req;
  const userToken = headers['authorization'];
  const isAuthorized = await userIsAuthorized(userToken, ['super_admin']);

  if (!isAuthorized) {
    return res.status(403).json({
      msg: 'Request is not authorized to perform super admin functionality',
    });
  }

  // Start getting data here
  const statsData = await getStatsData();
  return res.json(statsData);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'GET': {
      return handleGetRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}

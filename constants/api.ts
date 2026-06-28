export const BASE_URI = 'http://34.234.96.118:3000';
// export const BASE_URI = 'http://192.168.1.7:3000';


export const API_PATHS = {
  auth: {
    signin: '/users/signin',
    logout: '/users/logout',
  },

  readings: {
    create: '/readings/create',
  },

  face: {
    register: '/face/register',
    verify: '/face/verify',
  },
} as const;
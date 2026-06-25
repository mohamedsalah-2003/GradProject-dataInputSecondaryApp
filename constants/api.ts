export const BASE_URI = 'http://192.168.1.7:3000';

export const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTA2MDkzNzNlMTRmNWZhMzYyMzAzYzYiLCJlbWFpbCI6Im1vaGFtZWQyMjMzNDQ2MzFAZ21haWwuY29tIiwiaWF0IjoxNzgyMzg1NjM1LCJleHAiOjE4MTM5NDMyMzUsImp0aSI6IjBlN2VhZGI3LTQ3NGEtNDBjMi04ZTQ0LWZmZWE1MzA4ZTI1OSJ9.dLUm-LJGc9cnqjsn6z38qdh7DGVoh3-vUB7xzJnc2PI';

export const API_PATHS = {
  readings: {
    create: '/readings/create',
  },
  face: {
    register: '/face/register',
    verify: '/face/verify',
  },
} as const;

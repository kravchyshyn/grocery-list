export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  password: '',
};

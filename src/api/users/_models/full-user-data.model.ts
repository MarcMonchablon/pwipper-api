import { SimpleUserData } from './simple-user-data.model';

export interface FullUserData extends SimpleUserData {
  id: string;
  username: string;
  email: string;
  bio: string;
  hadFirstTour: boolean;
  creationDate: any;
}

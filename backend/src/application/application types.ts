import { Types } from "mongoose";

type statusType = 'applied' | 'under-review' | 'interviewing' | 'offered' | 'accepted' | 'rejected' | 'withdrawn' ;


export interface IApplication{
    user:Types.ObjectId;
    opportunity:Types.ObjectId;
    status: statusType;
    createdAt:Date;
    updatedAt:Date;
}
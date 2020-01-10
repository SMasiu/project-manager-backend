import { Injectable } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {

    setToken(id) {
        
        const token = jwt.sign({id}, process.env.JWT_KEY);

    }

}
import { Injectable } from "@nestjs/common";
import { DatabaseServide } from "src/shared/services/database.service";

@Injectable()
export class UserService {

    constructor(private readonly databaseService: DatabaseServide) { }

    createUser() {
    
    }

    getUser() {

    }

    getUsers() {

    }

}
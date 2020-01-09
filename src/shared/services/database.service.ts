import { Client } from "pg";
import db from "src/database/client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DatabaseServide {
    
    client: Client;

    constructor() {
        this.client = db.client;
    }

}
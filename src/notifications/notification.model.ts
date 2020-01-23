import { ObjectType, Field } from "type-graphql";
import { Team } from "src/teams/team.model";
import { User } from "src/user/user.model";

@ObjectType()
export class Notifications {
  @Field(type => [Team])  
  teamInvitations: Team[];

  @Field(type => [User])
  friendInvitations: User[];
}
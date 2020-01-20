import { ObjectType, Field } from "type-graphql";
import { Team } from "src/teams/team.model";

@ObjectType()
export class Notifications {
  @Field(type => [Team])  
  teamInvitations: Team[];
}
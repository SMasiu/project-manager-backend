import { Resolver, Mutation, Args, Context } from "@nestjs/graphql";
import { TaskUsersService } from "./task-users.service";
import { User } from "src/user/user.model";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { ProjectGuard } from "src/shared/guards/project.guard";
import { TaskGuard } from "src/shared/guards/task.guard";
import { UserTaskArgs } from "./task-users.args";
import { take } from "rxjs/operators";

@Resolver()
export class TaskUsersResolver {

    constructor(private readonly taskUsersService: TaskUsersService) {}

    @Mutation(type => User)
    @UseGuards(AuthGuard, ProjectGuard, TaskGuard)
    async AddUserToTask(@Args() args: UserTaskArgs, @Context() ctx) {
        try {
            return await this.taskUsersService.addUserToTask(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => User)
    @UseGuards(AuthGuard, ProjectGuard, TaskGuard)
    async DeleteUserFromTask(@Args() args: UserTaskArgs) {
        try {
            return await this.taskUsersService.deleteUserFromTask(args).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}
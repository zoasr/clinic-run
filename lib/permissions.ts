import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
	project: ["create", "share", "update", "delete"], // <-- Permissions available for created roles
} as const;

export const ac = createAccessControl(statement);

export const doctor = ac.newRole({
	project: ["create", "update", "delete", "share"],
});

export const admin = ac.newRole({
	project: ["create", "update", "delete", "share"],
});
export const staff = ac.newRole({
	project: ["create", "update", "share"],
});

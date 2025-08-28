import type { AppRouter } from "../../lib/routers/index.js";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

export type Appointment = RouterInput["appointments"]["create"];
export type Patient = RouterInput["patients"]["create"];
export type Doctor = Omit<RouterInput["users"]["create"], "password">;
export type MedicalRecord = RouterInput["medicalRecords"]["create"];
export type Medication = RouterInput["medications"]["create"];
export type MedicationOutput = RouterOutput["medications"]["getById"];
export type Prescription = RouterInput["prescriptions"]["create"];
export type PrescriptionOutput = RouterOutput["prescriptions"]["getById"];
export type LabTest = RouterInput["labTests"]["create"];
export type LabTestOutput = RouterOutput["labTests"]["getById"];

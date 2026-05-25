export { useListCourses } from "./useListCourses";
export type { AdminCourseListItem, ListCoursesFilters } from "./useListCourses";

export { useCreateCourse } from "./useCreateCourse";
export type { CreateCourseResult } from "./useCreateCourse";

export { useUpdateCourse } from "./useUpdateCourse";
export type { UpdateCourseInput, UpdateCourseResult } from "./useUpdateCourse";

export { useDeleteCourse } from "./useDeleteCourse";

export { useUpdateCourseStatus } from "./useUpdateCourseStatus";
export type { UpdateCourseStatusResult } from "./useUpdateCourseStatus";

export { useGetFullCourse } from "./useGetFullCourse";
export type { FullCourseData, FullCourseDetails, ExamSettings } from "./useGetFullCourse";
export { mapApiToBuilderDrafts, mapApiToFullCourseData } from "./normalize-full-course";
export type { CourseDrafts } from "./normalize-full-course";

export { useSaveEnrollmentForm } from "./useSaveEnrollmentForm";
export type {
  SaveEnrollmentFormPayload,
  SaveEnrollmentFormResult,
  EnrollmentFormField,
  EnrollmentFormGroup,
  EnrollmentFieldType,
} from "./useSaveEnrollmentForm";

export { useSaveQuiz } from "./useSaveQuiz";
export type { SaveQuizPayload, SaveQuizResult, QuizQuestion, QuizOption } from "./useSaveQuiz";

export { useSaveExamSettings } from "./useSaveExamSettings";
export type { SaveExamSettingsPayload, SaveExamSettingsResult } from "./useSaveExamSettings";

export { useUploadCertificate } from "./useUploadCertificate";
export type { UploadCertificateResult } from "./useUploadCertificate";

export {
  hasEnrollmentForm,
  hasQuiz,
  hasExamSettings,
  hasCertificate,
  getMaxBuilderStep,
} from "./builder-utils";

export type { CourseStatus, PaginationMeta, ValidationError } from "./shared";
export {
  BASE_URL,
  adminCourseFetch,
  coursePath,
  listCoursesPath,
  getPreFetchError,
  extractErrorMessage,
  formatValidationErrors,
  getFetchErrorMessage,
  safeReadJson,
  ADMIN_SESSION_EXPIRED,
  BACKEND_NOT_CONFIGURED,
} from "./shared";

import { create } from "zustand";

export interface CourseDrafts {
    basicInfo: any;
    enrollmentForm: any;
    quiz: any;
    examSettings: any;
    certificate: any;
}

interface BuilderState {
    step: number;
    courseId: string | null;
    drafts: CourseDrafts;
    setStep: (step: number) => void;
    setCourseId: (id: string | null) => void;
    setDraft: (key: keyof CourseDrafts, data: any) => void;
    hydrateFromApi: (apiData: any) => void;
    reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
    step: 1,
    courseId: null,
    drafts: {
        basicInfo: null,
        enrollmentForm: null,
        quiz: null,
        examSettings: null,
        certificate: null,
    },
    setStep: (step) => set({ step }),
    setCourseId: (courseId) => set({ courseId }),
    setDraft: (key, data) => set((state) => ({ drafts: { ...state.drafts, [key]: data } })),

    // Maps the GET /full API response directly to our drafts
    hydrateFromApi: (apiData) => set({
        courseId: apiData.course?.id || null,
        drafts: {
            basicInfo: apiData.course,
            enrollmentForm: apiData.enrollmentForm,
            quiz: apiData.quiz,
            examSettings: apiData.examSettings,
            certificate: apiData.certificate,
        }
    }),

    reset: () => set({
        step: 1,
        courseId: null,
        drafts: { basicInfo: null, enrollmentForm: null, quiz: null, examSettings: null, certificate: null }
    })
}));
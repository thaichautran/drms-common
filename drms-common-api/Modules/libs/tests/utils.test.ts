import { OGUtils } from "../core/helpers/utils";

describe("testing OGUtils", () => {
    test("dateToString should result as string", () => {
        expect(OGUtils.dateToString(new Date(2020, 1, 2, 0, 0, 0, 0))).toBe("02-02-2020");
    });

    test("dateToDateStringQuery should result as string", () => {
        expect(OGUtils.dateToDateStringQuery(new Date(2020, 1, 2, 0, 0, 0, 0))).toBe("2020-02-02");
    });

    test("getTimeFromDate should result as string", () => {
        expect(OGUtils.getTimeFromDate(new Date(2020, 1, 2, 20, 20, 20, 0))).toBe("20:20");
    });

    test("dateToTimeString should result as string", () => {
        expect(OGUtils.dateToTimeString(new Date(2020, 1, 2, 20, 20, 20, 0))).toBe("02-02-2020 20:20");
    });

    test("formatNumber should result as string", () => {
        expect(OGUtils.formatNumber(20.2020, 0, 3)).toBe("20,202");
    });

    test("isNormalize should return true", () => {
        expect(OGUtils.isNormalize("normalizestring")).toBeTruthy();
    });

    test("buildFormData should return FormData type", () => {
        const formData: FormData = new FormData();
        expect(OGUtils.buildFormData(formData, {})).toBeInstanceOf(FormData);
    });

    test("jsonToFormData should return FormData type", () => {
        const testingJson = {
            id: "unique-id",
            object: "test-object"
        };
        const testingFormData = OGUtils.jsonToFormData(testingJson);
        expect(testingFormData).toBeInstanceOf(FormData);
        expect(testingFormData.has("id")).toBeTruthy();
        expect(testingFormData.has("object")).toBeTruthy();
        expect(testingFormData.get("id")).toBe(testingJson.id);
        expect(testingFormData.get("object")).toBe(testingJson.object);
    });

    test("toLowerCaseNonAccentVietnamese should return as string", () => {
        expect(OGUtils.toLowerCaseNonAccentVietnamese("Hạ tầng")).toBe("ha tang");
    });
});
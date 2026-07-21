import { beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/notes/route";
import { resetNotes } from "@/features/notes/server/notes-store";

function postRequest(body: unknown): Request {
  return new Request("http://test/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("notes route handler", () => {
  beforeEach(() => {
    resetNotes();
  });

  it("GET returns an empty list initially", async () => {
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.notes).toEqual([]);
  });

  it("POST adds a note and returns 201", async () => {
    const res = await POST(postRequest({ text: "hello" }));
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.note.text).toBe("hello");

    const list = await (await GET()).json();
    expect(list.notes).toHaveLength(1);
  });

  it("POST rejects an invalid body with 400", async () => {
    const res = await POST(postRequest({ text: "" }));
    expect(res.status).toBe(400);
  });
});

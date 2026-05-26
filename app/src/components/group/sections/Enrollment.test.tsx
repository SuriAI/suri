import type { ReactNode } from "react"
import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Enrollment } from "@/components/group/sections/Enrollment"
import { useGroupUIStore } from "@/components/group/stores"
import { createAttendanceGroup, createAttendanceMember } from "@/test/fixtures"
import { renderWithProviders } from "@/test/utils/renderWithProviders"

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

vi.mock("@/components/group/sections/enrollment/CameraQueue", () => ({
  CameraQueue: () => <div>Mock Camera Queue</div>,
}))

vi.mock("@/components/group/sections/enrollment/BulkEnrollment", () => ({
  BulkEnrollment: () => <div>Mock Bulk Enrollment</div>,
}))

vi.mock("@/components/group/sections", async () => {
  const actual = await vi.importActual<typeof import("@/components/group/sections")>(
    "@/components/group/sections",
  )
  return {
    ...actual,
    FaceCapture: ({ initialSource }: { initialSource: string }) => (
      <div>Mock Face Capture ({initialSource})</div>
    ),
  }
})

function resetGroupUIStore() {
  useGroupUIStore.setState({
    activeSection: "overview",
    isSidebarCollapsed: false,
    isMobileDrawerOpen: false,
    showAddMemberModal: false,
    showEditMemberModal: false,
    showCreateGroupModal: false,
    showEditGroupModal: false,
    editingMember: null,
    preSelectedMemberId: null,
    lastEnrollmentSource: null,
    lastEnrollmentMode: null,
  })
}

describe("Enrollment", () => {
  beforeEach(() => {
    resetGroupUIStore()
  })

  it("shows the empty state when the group has no members", () => {
    renderWithProviders(
      <Enrollment
        group={createAttendanceGroup()}
        members={[]}
        onRefresh={vi.fn()}
        onAddMember={vi.fn()}
      />,
      { withDialogProvider: false },
    )

    expect(screen.getByText("This group has no members")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add Member" })).toBeInTheDocument()
  })

  it("lets the user choose an enrollment source", async () => {
    const { user } = renderWithProviders(
      <Enrollment
        group={createAttendanceGroup()}
        members={[createAttendanceMember({ person_id: "member-1", name: "Alice" })]}
        onRefresh={vi.fn()}
      />,
      { withDialogProvider: false },
    )

    await user.click(screen.getByRole("button", { name: /Camera/i }))
    expect(useGroupUIStore.getState().lastEnrollmentSource).toBe("camera")
    expect(useGroupUIStore.getState().lastEnrollmentMode).toBeNull()
  })

  it("renders the bulk upload path for upload + bulk mode", () => {
    useGroupUIStore.setState({
      lastEnrollmentSource: "upload",
      lastEnrollmentMode: "bulk",
    })

    renderWithProviders(
      <Enrollment
        group={createAttendanceGroup()}
        members={[createAttendanceMember({ person_id: "member-1", name: "Alice" })]}
        onRefresh={vi.fn()}
      />,
      { withDialogProvider: false },
    )

    expect(screen.getByText("Mock Bulk Enrollment")).toBeInTheDocument()
  })

  it("renders the camera queue path for camera + queue mode", () => {
    useGroupUIStore.setState({
      lastEnrollmentSource: "camera",
      lastEnrollmentMode: "queue",
    })

    renderWithProviders(
      <Enrollment
        group={createAttendanceGroup()}
        members={[createAttendanceMember({ person_id: "member-1", name: "Alice" })]}
        onRefresh={vi.fn()}
      />,
      { withDialogProvider: false },
    )

    expect(screen.getByText("Mock Camera Queue")).toBeInTheDocument()
  })

  it("renders the face capture path for single mode and maps camera to live", () => {
    useGroupUIStore.setState({
      lastEnrollmentSource: "camera",
      lastEnrollmentMode: "single",
    })

    renderWithProviders(
      <Enrollment
        group={createAttendanceGroup()}
        members={[createAttendanceMember({ person_id: "member-1", name: "Alice" })]}
        onRefresh={vi.fn()}
      />,
      { withDialogProvider: false },
    )

    expect(screen.getByText("Mock Face Capture (live)")).toBeInTheDocument()
  })
})

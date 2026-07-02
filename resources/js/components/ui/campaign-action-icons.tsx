/**
 * Icons for the campaign confirmation dialogs, shared between the per-form
 * campaigns list and the global campaigns board.
 */
export const campaignActionIcons = {
    close: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden="true"
        >
            <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75" />
            <path d="M6.75 10.5h10.5a2.25 2.25 0 0 1 2.25 2.25v6a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25v-6a2.25 2.25 0 0 1 2.25-2.25Z" />
        </svg>
    ),
    reopen: (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
            aria-hidden="true"
        >
            <path d="M16.023 9.348h4.992V4.356" />
            <path d="M2.985 19.644v-4.992h4.992" />
            <path d="M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 14.652l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7" />
        </svg>
    ),
} as const;

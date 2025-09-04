# Super Worker Workflow Enhancement

## Overview
Enhance the workflow for Super Workers by adding functionality for requesting changes, increasing prices, and implementing approval processes for both price changes and final job completion.

## Tasks

### Request Changes Button
- [ ] Add 'Request Changes' button to Homework modal (only visible when status is 'In Progress')
- [ ] Implement backend handler in `actions.ts` for processing change requests
- [ ] Update notification system to alert Student and Super Agent of requested changes

### Price Increase Functionality
- [ ] Add 'Increase Price' button with text area input field (amount in £)
- [ ] Implement state management for price increase requests
- [ ] Create notification template for price increase requests
- [ ] Add status 'Price Increase Requested' to `HomeworkStatus` enum in `types.ts`

### Approval Workflow
- [ ] Add 'Approve/Reject' buttons for Student to respond to price increase requests
- [ ] Implement handlers for both approval and rejection paths
- [ ] Update Homework modal to reflect price changes when approved
- [ ] Update earnings calculations for Super Worker when price increase is approved
- [ ] Ensure rejected price increases don't affect Super Worker earnings

### Final Job Approval Process
- [ ] Add workflow for Super Worker to approve final job files from Worker
- [ ] Implement 'Final Payment Approval' status in `HomeworkStatus` enum
- [ ] Add Approve/Reject buttons for Super Agent to confirm full payment
- [ ] Create notification template for payment issues
- [ ] Implement status transition: Approved → 'Completed'

## Implementation Strategy

1. First, update the database schema and types to support new statuses and fields
2. Implement the backend handlers for change requests and price increases
3. Create the UI components for the new buttons and approval workflows
4. Update the notification system to handle new notification types
5. Test the complete workflow with all user roles
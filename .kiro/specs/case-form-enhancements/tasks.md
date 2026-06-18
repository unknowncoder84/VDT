# Implementation Plan

- [-] 1. Update CreateCaseForm with On Behalf Of dropdown and remove Payment Mode



  - [ ] 1.1 Replace "On Behalf Of" text input with FormSelect dropdown
    - Add dropdown options: Petitioner, Applicant, Appellant, Respondent, Intervenor


    - Update formData state to use the new dropdown value
    - _Requirements: 1.1, 1.2_
  - [ ] 1.2 Remove Payment Mode field from the create case form
    - Remove the FormSelect for paymentMode
    - Remove paymentMode from formData state initialization
    - _Requirements: 5.1, 5.2_



  - [ ] 1.3 Write property test for On Behalf Of round trip
    - **Property 1: On Behalf Of Round Trip**


    - **Validates: Requirements 1.2, 1.3**

- [ ] 2. Update CaseDetailsPage with NOC status and Grant Date
  - [ ] 2.1 Add NOC option to case status dropdown in basic details
    - Add "noc" option with label "NOC" to the status dropdown
    - Ensure status change persists when saved
    - _Requirements: 2.1, 2.2_
  - [ ] 2.2 Rename Circulation Date to Grant Date in circulation tab
    - Change label from "CIRCULATION DATE" to "GRANT DATE"
    - Update state variable name from circulationDate to grantDate
    - Update the handleUpdateCirculation function to use grantDate
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 2.3 Write property test for Case Status NOC consistency
    - **Property 2: Case Status NOC Consistency**
    - **Validates: Requirements 2.3**
  - [ ] 2.4 Write property test for Grant Date persistence
    - **Property 3: Grant Date Persistence**
    - **Validates: Requirements 3.2, 3.3**

- [ ] 3. Implement automatic case status update based on filing date
  - [ ] 3.1 Add useEffect hook to check filing date on case load
    - Compare current date with filing date
    - If filing date has passed, set circulationStatus to "non-circulated"



    - Call updateCase to persist the change
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 3.2 Write property test for automatic non-circulated status
    - **Property 4: Automatic Non-Circulated Status**
    - **Validates: Requirements 4.1, 4.3**

- [ ] 4. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [-] 5. Implement dynamic fee tracking


  - [-] 5.1 Ensure fees quoted from case creation reflects in case details

    - Display feesQuoted in the payments tab summary


    - Use caseData.feesQuoted for the fees quoted display
    - _Requirements: 6.1_
  - [ ] 5.2 Update Finance page to dynamically calculate totals from cases
    - Ensure totalFeesQuoted sums all case feesQuoted values
    - Ensure pendingAmount calculates correctly (quoted - received)
    - _Requirements: 6.2, 6.3_
  - [ ] 5.3 Write property test for fees quoted display consistency
    - **Property 6: Fees Quoted Display Consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 6. Implement dynamic payment tracking
  - [ ] 6.1 Update payment handling to reflect across all pages
    - When payment is added, update feesPaid state
    - Ensure payment data syncs with DataContext
    - _Requirements: 7.1, 7.2_
  - [ ] 6.2 Implement pending amount calculation
    - Calculate pending = feesQuoted - feesPaid
    - Display pending amount in payments tab and Finance page
    - _Requirements: 7.3_
  - [ ] 6.3 Ensure admin-accepted payments persist and reflect everywhere
    - When admin accepts payment, persist to database
    - Update all financial displays with new payment data
    - _Requirements: 7.4_
  - [ ] 6.4 Write property test for payment calculation invariant
    - **Property 7: Payment Calculation Invariant**
    - **Validates: Requirements 7.1, 7.3**
  - [ ] 6.5 Write property test for payment persistence and reflection
    - **Property 8: Payment Persistence and Reflection**
    - **Validates: Requirements 7.2, 7.4**

- [ ] 7. Update On Behalf Of display in CaseDetailsPage
  - [ ] 7.1 Display On Behalf Of value in basic details section
    - Show the selected onBehalfOf value from case data
    - Format the display to show proper label (e.g., "PETITIONER")
    - _Requirements: 1.3_

- [ ] 8. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

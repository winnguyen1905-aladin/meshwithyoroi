use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/address.{Address, from_verification_key}
use cardano/assets.{lovelace_of}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction, find_input,
}

// Helper: Get inputs at a specific address
fn inputs_at(inputs: List<Input>, address: Address) -> List<Input> {
  list.filter(inputs, fn(input) { input.output.address == address })
}

// Helper: Get outputs at a specific address
fn outputs_at(outputs: List<Output>, address: Address) -> List<Output> {
  list.filter(outputs, fn(output) { output.address == address })
}

// ==================== TYPES ====================

/// Contract state enum
pub type ContractState {
  Funded
  Finished
}

/// Datum structure for escrow contract
pub type Datum {
  aladin: VerificationKeyHash,
  genie: VerificationKeyHash,
  state: ContractState,
  payment_amount: Int,
  job_id: ByteArray,
}

/// Redeemer actions
pub type Redeemer {
  Fund
  ApprovePayment
  Cancel
}

// ==================== VALIDATOR ====================

/// Escrow validator for job payments
/// Supports: Fund, ApprovePayment, and Cancel operations
validator escrow {
  spend(
    _datum: Option<Datum>,
    redeemer: Redeemer,
    ref: OutputReference,
    tx: Transaction,
  ) -> Bool {
    // Get the script's own address from the input being spent
    let own_address =
      when find_input(tx.inputs, ref) is {
        Some(own_input) -> own_input.output.address
        None -> fail @"Input not found"
      }

    // Handle different redeemer actions
    when redeemer is {
      // ===== FUND: Aladin deposits funds to escrow =====
      Fund -> {
        // Expect exactly one input and one output at script address
        expect ([input], [output]) =
          (inputs_at(tx.inputs, own_address), outputs_at(tx.outputs, own_address))

        // Extract and validate output datum
        expect InlineDatum(raw_output_datum) = output.datum
        expect out_datum: Datum = raw_output_datum

        // Validate datum state is Funded
        expect out_datum.state == Funded

        // Verify transaction is signed by aladin
        let must_be_signed = list.has(tx.extra_signatories, out_datum.aladin)

        // Validate payment amount
        let aladin_deposited = lovelace_of(input.output.value)
        let output_value = lovelace_of(output.value)
        let is_sufficient_payment_amount =
          aladin_deposited >= out_datum.payment_amount && aladin_deposited >= output_value

        // Return validation result
        must_be_signed && is_sufficient_payment_amount
      }

      // ===== APPROVE PAYMENT: Release funds to genie =====
      ApprovePayment -> {
        // Get input from script address
        expect [input] = inputs_at(tx.inputs, own_address)

        // Extract and validate input datum
        expect InlineDatum(raw_input_datum) = input.output.datum
        expect input_datum: Datum = raw_input_datum

        // Validate datum state is Funded
        expect input_datum.state == Funded

        // Get genie's address from their verification key (testnet)
        let genie_address = from_verification_key(input_datum.genie)

        // Verify payment goes to genie
        expect [output] = outputs_at(tx.outputs, genie_address)
        let genie_received = output.value
        let is_full_payment = lovelace_of(genie_received) >= input_datum.payment_amount

        // Verify transaction is signed by aladin
        let must_be_signed = list.has(tx.extra_signatories, input_datum.aladin)

        // Return validation result
        must_be_signed && is_full_payment
      }

      // ===== CANCEL: Refund to aladin (requires both signatures) =====
      Cancel -> {
        // Get input from script address
        expect [input] = inputs_at(tx.inputs, own_address)

        // Extract datum
        expect InlineDatum(raw_input_datum) = input.output.datum
        expect input_datum: Datum = raw_input_datum

        // Require both aladin and genie signatures
        let aladin_signed = list.has(tx.extra_signatories, input_datum.aladin)
        let genie_signed = list.has(tx.extra_signatories, input_datum.genie)

        // Return validation result
        aladin_signed && genie_signed
      }
    }
  }
}

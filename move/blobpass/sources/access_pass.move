module blobpass::access_pass {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;

    public struct DataAccessPass has key, store {
        id: UID,
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        walrus_blob_id: String,
    }

    public struct Ecosystem has key {
        id: UID,
    }

    fun init(ctx: &mut TxContext) {
        // Create the ecosystem shared object to act as our Kiosk Ecosystem ID
        transfer::share_object(Ecosystem {
            id: object::new(ctx),
        });
    }

    public fun mint(
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        walrus_blob_id: String,
        ctx: &mut TxContext
    ): DataAccessPass {
        DataAccessPass {
            id: object::new(ctx),
            title,
            description,
            file_size,
            file_type,
            preview_image_url,
            walrus_blob_id,
        }
    }
}

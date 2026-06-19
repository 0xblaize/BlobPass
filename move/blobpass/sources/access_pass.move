module blobpass::access_pass {
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::option::{Self, Option};
    use std::string::String;

    const EListingAlreadySold: u64 = 0;
    const EInsufficientPayment: u64 = 1;
    const EDuplicateBlobHash: u64 = 2;
    const EUnknownBlobHash: u64 = 3;
    const ERoyaltyRequired: u64 = 4;
    const ENotListingSeller: u64 = 5;
    const ESupplyCapReached: u64 = 6;

    const MAX_REGISTERED_BLOBS: u64 = 500;

    public struct DataAccessPass has key, store {
        id: UID,
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        walrus_blob_id: String,
        file_hash: vector<u8>,
        storage_start_epoch: u64,
        storage_end_epoch: u64,
        original_uploader: address,
        royalty_bps: u64,
    }

    public struct Listing has key {
        id: UID,
        seller: address,
        price: u64,
        pass: Option<DataAccessPass>,
    }

    public struct Ecosystem has key {
        id: UID,
    }

    public struct BlobRegistry has key {
        id: UID,
        hash_index: Table<vector<u8>, BlobRecord>,
        blob_count: u64,
        pointer_count: u64,
        default_royalty_bps: u64,
    }

    public struct BlobRecord has copy, drop, store {
        file_hash: vector<u8>,
        walrus_blob_id: String,
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        uploader: address,
        first_pass_id: ID,
        storage_start_epoch: u64,
        storage_end_epoch: u64,
        royalty_bps: u64,
        access_count: u64,
        royalty_paid_mist: u64,
    }

    public struct BlobObject has key, store {
        id: UID,
        file_hash: vector<u8>,
        walrus_blob_id: String,
        uploader: address,
        listing_id: ID,
        pass_id: ID,
        storage_start_epoch: u64,
        storage_end_epoch: u64,
        royalty_bps: u64,
    }

    public struct ListingCreated has copy, drop {
        listing_id: ID,
        pass_id: ID,
        seller: address,
        price: u64,
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
    }

    public struct BlobRegistered has copy, drop {
        listing_id: ID,
        pass_id: ID,
        blob_object_id: ID,
        uploader: address,
        file_hash: vector<u8>,
        walrus_blob_id: String,
        storage_start_epoch: u64,
        storage_end_epoch: u64,
        royalty_bps: u64,
    }

    public struct AccessPointerMinted has copy, drop {
        pass_id: ID,
        original_pass_id: ID,
        buyer: address,
        original_uploader: address,
        file_hash: vector<u8>,
        walrus_blob_id: String,
        royalty_paid_mist: u64,
        storage_end_epoch: u64,
    }

    public struct StorageExtended has copy, drop {
        file_hash: vector<u8>,
        walrus_blob_id: String,
        payer: address,
        previous_end_epoch: u64,
        storage_end_epoch: u64,
        additional_epochs: u64,
    }

    public struct ListingPurchased has copy, drop {
        listing_id: ID,
        pass_id: ID,
        seller: address,
        buyer: address,
        price: u64,
    }

    public struct ListingDelisted has copy, drop {
        listing_id: ID,
        pass_id: ID,
        seller: address,
    }

    fun init(ctx: &mut TxContext) {
        // Create the shared Ecosystem object used by every listing call in the custom access ledger
        transfer::share_object(Ecosystem {
            id: object::new(ctx),
        });
        transfer::share_object(BlobRegistry {
            id: object::new(ctx),
            hash_index: table::new(ctx),
            blob_count: 0,
            pointer_count: 0,
            default_royalty_bps: 500,
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
            file_hash: vector[],
            storage_start_epoch: 0,
            storage_end_epoch: 0,
            original_uploader: tx_context::sender(ctx),
            royalty_bps: 0,
        }
    }

    fun mint_registered(
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        walrus_blob_id: String,
        file_hash: vector<u8>,
        storage_start_epoch: u64,
        storage_end_epoch: u64,
        original_uploader: address,
        royalty_bps: u64,
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
            file_hash,
            storage_start_epoch,
            storage_end_epoch,
            original_uploader,
            royalty_bps,
        }
    }

    public fun has_file_hash(registry: &BlobRegistry, file_hash: vector<u8>): bool {
        table::contains(&registry.hash_index, file_hash)
    }

    public entry fun create_listing(
        _ecosystem: &mut Ecosystem,
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        walrus_blob_id: String,
        price: u64,
        ctx: &mut TxContext
    ) {
        let pass = mint(
            title,
            description,
            file_size,
            file_type,
            preview_image_url,
            walrus_blob_id,
            ctx,
        );
        let pass_id = object::uid_as_inner(&pass.id);
        let listing_uid = object::new(ctx);
        let listing_id = object::uid_to_inner(&listing_uid);
        let seller = tx_context::sender(ctx);

        event::emit(ListingCreated {
            listing_id,
            pass_id: *pass_id,
            seller,
            price,
            title: pass.title,
            description: pass.description,
            file_size: pass.file_size,
            file_type: pass.file_type,
            preview_image_url: pass.preview_image_url,
        });

        transfer::share_object(Listing {
            id: listing_uid,
            seller,
            price,
            pass: option::some(pass),
        });
    }

    public entry fun create_registered_listing(
        registry: &mut BlobRegistry,
        _ecosystem: &mut Ecosystem,
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        walrus_blob_id: String,
        file_hash: vector<u8>,
        storage_epochs: u64,
        price: u64,
        ctx: &mut TxContext
    ) {
        assert!(!table::contains(&registry.hash_index, file_hash), EDuplicateBlobHash);
        assert!(registry.blob_count < MAX_REGISTERED_BLOBS, ESupplyCapReached);

        let seller = tx_context::sender(ctx);
        let storage_start_epoch = tx_context::epoch(ctx);
        let storage_end_epoch = storage_start_epoch + storage_epochs;
        let royalty_bps = registry.default_royalty_bps;
        let pass = mint_registered(
            title,
            description,
            file_size,
            file_type,
            preview_image_url,
            walrus_blob_id,
            file_hash,
            storage_start_epoch,
            storage_end_epoch,
            seller,
            royalty_bps,
            ctx,
        );
        let pass_id = object::uid_as_inner(&pass.id);
        let listing_uid = object::new(ctx);
        let listing_id = object::uid_to_inner(&listing_uid);
        let blob_uid = object::new(ctx);
        let blob_object_id = object::uid_to_inner(&blob_uid);

        table::add(
            &mut registry.hash_index,
            pass.file_hash,
            BlobRecord {
                file_hash: pass.file_hash,
                walrus_blob_id: pass.walrus_blob_id,
                title: pass.title,
                description: pass.description,
                file_size: pass.file_size,
                file_type: pass.file_type,
                preview_image_url: pass.preview_image_url,
                uploader: seller,
                first_pass_id: *pass_id,
                storage_start_epoch,
                storage_end_epoch,
                royalty_bps,
                access_count: 0,
                royalty_paid_mist: 0,
            },
        );
        registry.blob_count = registry.blob_count + 1;

        event::emit(ListingCreated {
            listing_id,
            pass_id: *pass_id,
            seller,
            price,
            title: pass.title,
            description: pass.description,
            file_size: pass.file_size,
            file_type: pass.file_type,
            preview_image_url: pass.preview_image_url,
        });

        event::emit(BlobRegistered {
            listing_id,
            pass_id: *pass_id,
            blob_object_id,
            uploader: seller,
            file_hash: pass.file_hash,
            walrus_blob_id: pass.walrus_blob_id,
            storage_start_epoch,
            storage_end_epoch,
            royalty_bps,
        });

        transfer::public_transfer(
            BlobObject {
                id: blob_uid,
                file_hash: pass.file_hash,
                walrus_blob_id: pass.walrus_blob_id,
                uploader: seller,
                listing_id,
                pass_id: *pass_id,
                storage_start_epoch,
                storage_end_epoch,
                royalty_bps,
            },
            seller,
        );

        transfer::share_object(Listing {
            id: listing_uid,
            seller,
            price,
            pass: option::some(pass),
        });
    }

    public entry fun mint_access_pointer(
        registry: &mut BlobRegistry,
        file_hash: vector<u8>,
        royalty: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.hash_index, file_hash), EUnknownBlobHash);
        let royalty_paid_mist = coin::value(&royalty);
        assert!(royalty_paid_mist > 0, ERoyaltyRequired);

        let record = table::borrow_mut(&mut registry.hash_index, file_hash);
        let buyer = tx_context::sender(ctx);
        let pass = mint_registered(
            record.title,
            record.description,
            record.file_size,
            record.file_type,
            record.preview_image_url,
            record.walrus_blob_id,
            record.file_hash,
            record.storage_start_epoch,
            record.storage_end_epoch,
            record.uploader,
            record.royalty_bps,
            ctx,
        );
        let pass_id = object::uid_to_inner(&pass.id);

        record.access_count = record.access_count + 1;
        record.royalty_paid_mist = record.royalty_paid_mist + royalty_paid_mist;
        registry.pointer_count = registry.pointer_count + 1;

        transfer::public_transfer(royalty, record.uploader);

        event::emit(AccessPointerMinted {
            pass_id,
            original_pass_id: record.first_pass_id,
            buyer,
            original_uploader: record.uploader,
            file_hash: record.file_hash,
            walrus_blob_id: record.walrus_blob_id,
            royalty_paid_mist,
            storage_end_epoch: record.storage_end_epoch,
        });

        transfer::public_transfer(pass, buyer);
    }

    public entry fun extend_registered_storage(
        registry: &mut BlobRegistry,
        file_hash: vector<u8>,
        additional_epochs: u64,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&registry.hash_index, file_hash), EUnknownBlobHash);

        let record = table::borrow_mut(&mut registry.hash_index, file_hash);
        let previous_end_epoch = record.storage_end_epoch;
        record.storage_end_epoch = record.storage_end_epoch + additional_epochs;

        event::emit(StorageExtended {
            file_hash: record.file_hash,
            walrus_blob_id: record.walrus_blob_id,
            payer: tx_context::sender(ctx),
            previous_end_epoch,
            storage_end_epoch: record.storage_end_epoch,
            additional_epochs,
        });
    }

    public entry fun buy_listing(
        listing: &mut Listing,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(option::is_some(&listing.pass), EListingAlreadySold);
        assert!(coin::value(&payment) >= listing.price, EInsufficientPayment);

        let buyer = tx_context::sender(ctx);
        let listing_id = object::uid_to_inner(&listing.id);
        let pass = option::extract(&mut listing.pass);
        let pass_id = object::uid_to_inner(&pass.id);

        let seller_payment = coin::split(&mut payment, listing.price, ctx);
        transfer::public_transfer(seller_payment, listing.seller);

        if (coin::value(&payment) > 0) {
            transfer::public_transfer(payment, buyer);
        } else {
            coin::destroy_zero(payment);
        };

        event::emit(ListingPurchased {
            listing_id,
            pass_id,
            seller: listing.seller,
            buyer,
            price: listing.price,
        });

        transfer::public_transfer(pass, buyer);
    }

    public entry fun delist_listing(
        listing: &mut Listing,
        ctx: &mut TxContext
    ) {
        let seller = tx_context::sender(ctx);
        assert!(listing.seller == seller, ENotListingSeller);
        assert!(option::is_some(&listing.pass), EListingAlreadySold);

        let listing_id = object::uid_to_inner(&listing.id);
        let pass = option::extract(&mut listing.pass);
        let pass_id = object::uid_to_inner(&pass.id);

        event::emit(ListingDelisted {
            listing_id,
            pass_id,
            seller,
        });

        transfer::public_transfer(pass, seller);
    }
}

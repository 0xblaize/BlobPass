module blobpass::access_pass {
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::sui::SUI;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::option::{Self, Option};
    use std::string::String;

    const EListingAlreadySold: u64 = 0;
    const EInsufficientPayment: u64 = 1;

    public struct DataAccessPass has key, store {
        id: UID,
        title: String,
        description: String,
        file_size: String,
        file_type: String,
        preview_image_url: String,
        walrus_blob_id: String,
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

    public struct ListingPurchased has copy, drop {
        listing_id: ID,
        pass_id: ID,
        seller: address,
        buyer: address,
        price: u64,
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
}

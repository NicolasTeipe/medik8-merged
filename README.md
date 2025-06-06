# Medik8 Shopify 2.0 Theme

## Note for Distributor Stores & Developers

This repository is shared with Medik8 distributor teams to provide access to our base Shopify theme. However, the information in this README is intended for the internal Medik8 development team and covers internal tooling, deployment processes, and workflows that may not be relevant to your environment.

If you are a distributor developer, please refer to the separate documentation provided for general guidance. You are free to set up and manage the theme in a way that best suits your store's needs.

For any questions, please contact your Medik8 representative.

## Documentation

Full documentation can be viewed [here](https://medik8.atlassian.net/wiki/spaces/DT/pages/47644675/Development).

### Key Documents

Branch Strategy [[Link](https://medik8.atlassian.net/wiki/spaces/DT/pages/40402957/Branch+Strategy)]

Development Cycle [[Link](https://medik8.atlassian.net/wiki/spaces/DT/pages/47677455/Development+Cycle)]

## Handling .shopifyignore

There are two configurations for `.shopifyignore`: one for the remote repository and one for local development.

### Remote configuration

This version must **never be modified**. It is configured to **ignore all `.json` data files** to prevent `shopify theme push` from overwriting live store content.
    
### Local configuration

A `.shopifyignore.local` file is provided for development and testing purposes. You may temporarily copy its contents into `.shopifyignore` to allow pushing or pulling `.json` data. 

Always revert `.shopifyignore` to its original state before committing or pushing to ensure the remote version remains unchanged.
    

The remote `.shopifyignore` must remain consistent to avoid unintended data loss on live stores.

Additional information can be found [here](https://medik8.atlassian.net/wiki/spaces/DT/pages/47677455/Development+Cycle#Managing-the-theme-.json-data).

## Deployment

### Release Workflows

When certain branches are pushed, GitHub Actions will trigger a workflow to deploy to specific stores and themes.

When pushing to the `production` branch, the following stores and themes will be updated.

Store | Theme
-------|-----
UK | Production
US | Production
INT | Production
EU | Production
DE | Production
FR | Production

When pushing to a `release/*` branch, the following stores and themes will be updated.
Store | Theme
-------|-----
UK | Release Candidate
US | Release Candidate
INT | Release Candidate
EU | Release Candidate
DE | Release Candidate
FR | Release Candidate

Release branches should never be changed post release, they should be kept in their release state for use in the event a rollback is required.

### Distributor Workflow

There is another workflow that detects pushes to the `distributor-release` branch. This triggers a workflow that pushes this branch to the `main` branch of the `distributor-theme` repository, and this is how release updates are provided to distributors.

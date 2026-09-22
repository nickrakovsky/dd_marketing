/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Captured once at request start; never supplied by a visitor. */
    publicationDate?: Date;
    mdxImageCount?: number;
  }
}

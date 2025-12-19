"use client";

import React from "react";
import CreateSample from "./_components/create-sample";
import DeleteSample from "./_components/delete-sample";
import { useGetSample } from "./_api/get-sample";

export default function SamplePage() {
  const { data, isLoading } = useGetSample();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <p>{JSON.stringify(data)}</p>
      <CreateSample />
      <DeleteSample />
    </div>
  );
}

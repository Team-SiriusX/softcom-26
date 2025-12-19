import { Button } from "@/components/ui/button";
import React from "react";
import { useCreateSample } from "../_api/create-sample";

const CreateSample = () => {
  const { mutate , isPending} = useCreateSample();

  return (
    <Button disabled={isPending} onClick={() => mutate({ name: "Sample Name" })}>
      Create Sample
    </Button>
  );
};

export default CreateSample;

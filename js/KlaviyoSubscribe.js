export async function klaviyoSubscribe(form,formData) {
  formData = formData || new FormData(form);
  const formProps = Object.fromEntries(formData.entries());

  if (
    !formProps.email ||
    !formProps.key ||
    !formProps.list_id ||
    formProps.hpf
  ) {
    return false;
  }

  try {
    const response = await fetch(
      `https://a.klaviyo.com/client/subscriptions/?company_id=${formProps.key}`,
      options(formProps)
    );
    return response.status === 202;
  } catch (err) {
    return false;
  }
}

const options = formProps => ({
  method: 'POST',
  headers: { revision: '2024-02-15', 'content-type': 'application/json' },
  body: JSON.stringify({
    data: {
      type: 'subscription',
      attributes: {
        custom_source: `${formProps.source ?? 'No source specified'}`,
        profile: {
          data: {
            type: 'profile',
            attributes: {
              email: formProps.email,
            },
          },
        },
      },
      relationships: {
        list: { data: { type: 'list', id: formProps.list_id } },
      },
    },
  }),
});
